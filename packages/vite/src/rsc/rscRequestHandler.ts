import * as DefaultFetchAPI from '@whatwg-node/fetch'
import { normalizeNodeRequest } from '@whatwg-node/server'
import busboy from 'busboy'
import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express'
import type Router from 'find-my-way'
import type { HTTPMethod } from 'find-my-way'
import type { ViteDevServer } from 'vite'

import type { RscFetchProps } from '@redwoodjs/router/RscRouter'
import { getAuthState, getRequestHeaders } from '@redwoodjs/server-store'
import type { Middleware } from '@redwoodjs/web/dist/server/middleware'

import {
  decodeReply,
  decodeReplyFromBusboy,
} from '../bundled/react-server-dom-webpack.server.js'
import { hasStatusCode } from '../lib/StatusError.js'
import { invoke } from '../middleware/invokeMiddleware.js'
import { getFullUrlForFlightRequest } from '../utils.js'

import { sendRscFlightToStudio } from './rscStudioHandlers.js'
import { renderRsc } from './rscWorkerCommunication.js'

interface CreateRscRequestHandlerOptions {
  getMiddlewareRouter: () => Promise<Router.Instance<any>>
  viteDevServer?: ViteDevServer
}

export function createRscRequestHandler(
  options: CreateRscRequestHandlerOptions,
) {
  // This is mounted at /rw-rsc, so will have /rw-rsc stripped from req.url

  // above this line is for ALL users ☝️, not a per request basis
  // -------------
  return async (
    req: ExpressRequest,
    res: ExpressResponse,
    next: () => void,
  ) => {
    const basePath = '/rw-rsc/'

    console.log('basePath', basePath)
    console.log('req.originalUrl', req.originalUrl, 'req.url', req.url)
    console.log('req.headers.host', req.headers.host)
    console.log("req.headers['rw-rsc']", req.headers['rw-rsc'])

    const mwRouter = await options.getMiddlewareRouter()

    if (mwRouter) {
      // @MARK: Temporarily create Fetch Request here.
      // Ideally we'll have converted this whole handler to be Fetch Req and Response
      const webReq = normalizeNodeRequest(req, DefaultFetchAPI.Request)
      const matchedMw = mwRouter.find(webReq.method as HTTPMethod, webReq.url)

      const [mwResponse] = await invoke(
        webReq,
        matchedMw?.handler as Middleware | undefined,
        {
          params: matchedMw?.params,
          viteDevServer: options.viteDevServer,
        },
      )

      const webRes = mwResponse.toResponse()

      // @MARK: Grab the headers from MWResponse and set them on the Express Response
      // @TODO This is a temporary solution until we can convert this entire handler to use Fetch API
      // This WILL not handle multiple Set-Cookie headers correctly. Proper Fetch-Response support will resolve this.
      webRes.headers.forEach((value, key) => {
        res.setHeader(key, value)
      })

      if (mwResponse.isRedirect() || mwResponse.body) {
        // We also don't know what the Router will do if this RSC handler fails at any point
        // Whatever that behavior is, this should match.
        throw new Error(
          'Not Implemented: What should happen if this RSC handler fails? And which part - Client side router?',
        )
      }
    }

    // https://www.rfc-editor.org/rfc/rfc6648
    // "SHOULD NOT prefix their parameter names with "X-" or similar constructs."
    if (req.headers['rw-rsc'] !== '1') {
      return next()
    }

    const url = new URL(req.originalUrl || '', 'http://' + req.headers.host)
    let rscId: string | undefined
    // "location":{"pathname":"/about","search":""}
    // These values come from packages/vite/src/ClientRouter.tsx
    const props: RscFetchProps = JSON.parse(
      url.searchParams.get('props') || '{}',
    )
    let rsfId: string | undefined
    let args: unknown[] = []

    if (url.pathname.startsWith(basePath)) {
      rscId = url.pathname.split('/').pop()
      rsfId = url.searchParams.get('action_id') || undefined

      console.log('rscId', rscId)
      console.log('rsfId', rsfId)

      if (rscId && rscId !== '_') {
        res.setHeader('Content-Type', 'text/x-component')
      } else {
        rscId = undefined
      }

      if (rsfId) {
        // TODO (RSC): For React Server Actions we need to limit the request
        // size somehow
        // https://nextjs.org/docs/app/api-reference/functions/server-actions#size-limitation
        if (req.headers['content-type']?.startsWith('multipart/form-data')) {
          console.log('RSA: multipart/form-data')
          const bb = busboy({ headers: req.headers })
          // TODO (RSC): The generic here could be typed better
          const reply = decodeReplyFromBusboy<unknown[]>(bb)

          req.pipe(bb)
          args = await reply

          // TODO (RSC): Loop over args (to not only look at args[0])
          // TODO (RSC): Verify that this works with node16 (MDN says FormData is
          // only supported in node18 and up)
          if (args[0] instanceof FormData) {
            const serializedFormData: Record<string, any> = {}

            for (const [key, value] of args[0]) {
              // Several form fields can share the same name. This should be
              // represented as an array of the values of all those fields
              if (serializedFormData[key] !== undefined) {
                if (!Array.isArray(serializedFormData[key])) {
                  serializedFormData[key] = [serializedFormData[key]]
                }

                serializedFormData[key].push(value)
              } else {
                serializedFormData[key] = value
              }
            }

            args[0] = {
              __formData__: true,
              state: serializedFormData,
            }
          }
        } else {
          console.log('RSA: regular body')
          let body = ''

          for await (const chunk of req) {
            body += chunk
          }

          if (body) {
            args = await decodeReply(body)
          }
        }
      }
    }

    console.log('rscRequestHandler: args', args)

    if (rscId || rsfId) {
      const handleError = (err: unknown) => {
        if (hasStatusCode(err)) {
          res.statusCode = err.statusCode
        } else {
          console.info('Cannot render RSC', err)
          res.statusCode = 500
        }

        // Getting a warning on GitHub about this
        // https://github.com/redwoodjs/redwood/security/code-scanning/211
        // Handle according to TODO below
        res.end(String(err))
        // TODO (RSC): When we have `yarn rw dev` support we should do this:
        // if (options.command === 'dev') {
        //   res.end(String(err))
        // } else {
        //   res.end()
        // }
      }

      try {
        // We construct the URL for the flight request from props
        // e.g. http://localhost:8910/rw-rsc/__rwjs__Routes?props=location={pathname:"/about",search:"?foo=bar""}
        // becomes http://localhost:8910/about?foo=bar
        // In the component, getting location would otherwise be at the rw-rsc URL
        const fullUrl = getFullUrlForFlightRequest(req, props)

        const pipeable = renderRsc({
          rscId,
          props,
          rsfId,
          args,
          // Pass the serverState from server to the worker
          // Inside the worker, we'll use this to re-initalize the server state (because workers are stateless)
          serverState: {
            headersInit: Object.fromEntries(getRequestHeaders().entries()),
            serverAuthState: getAuthState(),
            fullUrl,
          },
        })

        await sendRscFlightToStudio({
          rscId,
          props,
          rsfId,
          args,
          basePath,
          req,
          handleError,
        })

        // TODO (RSC): See if we can/need to do more error handling here
        // pipeable.on(handleError)

        pipeable.pipe(res)
      } catch (e) {
        handleError(e)
      }
    }
  }
}
