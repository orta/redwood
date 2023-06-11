/* eslint-disable react-hooks/rules-of-hooks */
import { useDisableIntrospection } from '@envelop/disable-introspection'
import { useFilterAllowedOperations } from '@envelop/filter-operation-type'
import { GraphQLSchema, OperationTypeNode } from 'graphql'
import { Plugin, useReadinessCheck, createYoga } from 'graphql-yoga'

import { mapRwCorsOptionsToYoga } from './cors'
import { makeDirectivesForPlugin } from './directives/makeDirectives'
import { makeMergedSchema } from './makeMergedSchema'
import {
  useArmor,
  useRedwoodAuthContext,
  useRedwoodDirective,
  useRedwoodError,
  useRedwoodGlobalContextSetter,
  useRedwoodOpenTelemetry,
  useRedwoodLogger,
  useRedwoodPopulateContext,
  useRedwoodRealtime,
} from './plugins'
import type {
  useRedwoodDirectiveReturn,
  DirectivePluginOptions,
} from './plugins/useRedwoodDirective'
import { makeSubscriptions } from './subscriptions/makeSubscriptions'
import type { RedwoodSubscription } from './subscriptions/makeSubscriptions'
import type { GraphQLYogaOptions } from './types'

export const createGraphQLYoga = ({
  healthCheckId,
  loggerConfig,
  context,
  getCurrentUser,
  onException,
  generateGraphiQLHeader,
  extraPlugins,
  authDecoder,
  cors,
  services,
  sdls,
  directives = [],
  armorConfig,
  allowedOperations,
  allowIntrospection,
  allowGraphiQL,
  defaultError = 'Something went wrong.',
  graphiQLEndpoint = '/graphql',
  schemaOptions,
  realtime,
}: GraphQLYogaOptions) => {
  let schema: GraphQLSchema
  let redwoodDirectivePlugins = [] as Plugin[]
  const logger = loggerConfig.logger

  try {
    // @NOTE: Directives are optional
    const projectDirectives = makeDirectivesForPlugin(directives)

    if (projectDirectives.length > 0) {
      ;(redwoodDirectivePlugins as useRedwoodDirectiveReturn[]) =
        projectDirectives.map((directive) =>
          useRedwoodDirective(directive as DirectivePluginOptions)
        )
    }

    // @NOTE: Subscriptions are optional and only work in the context of a server
    let projectSubscriptions = [] as RedwoodSubscription[]

    if (realtime?.subscriptions?.subscriptions) {
      projectSubscriptions = makeSubscriptions(
        realtime.subscriptions.subscriptions
      )
    }

    schema = makeMergedSchema({
      sdls,
      services,
      directives: projectDirectives,
      subscriptions: projectSubscriptions,
      schemaOptions,
    })
  } catch (e) {
    logger.fatal(e as Error, '\n ⚠️ GraphQL server crashed \n')

    onException && onException()

    // Forcefully crash the graphql server
    // so users know that a misconfiguration has happened
    process.exit(1)
  }

  try {
    // Important: Plugins are executed in order of their usage, and inject functionality serially,
    // so the order here matters
    const plugins: Array<Plugin<any>> = []

    const isDevEnv = process.env.NODE_ENV === 'development'
    const disableIntrospection =
      (allowIntrospection === null && !isDevEnv) || allowIntrospection === false
    const disableGraphQL =
      (allowGraphiQL === null && !isDevEnv) || allowGraphiQL === false

    const defaultQuery = `query Redwood {
    redwood {
    version
    }
  }`

    // TODO: Once Studio is not experimental, can remove these generateGraphiQLHeaders
    const authHeader = `{"x-auth-comment": "See documentation: https://redwoodjs.com/docs/cli-commands#setup-graphiql-headers on how to auto generate auth headers"}`

    const graphiql = !disableGraphQL
      ? {
          title: 'Redwood GraphQL Playground',
          headers: generateGraphiQLHeader
            ? generateGraphiQLHeader()
            : authHeader,
          defaultQuery,
          headerEditorEnabled: true,
        }
      : false

    if (disableIntrospection) {
      plugins.push(useDisableIntrospection())
    }

    // Custom Redwood plugins
    plugins.push(useRedwoodAuthContext(getCurrentUser, authDecoder))
    plugins.push(useRedwoodGlobalContextSetter())

    if (context) {
      plugins.push(useRedwoodPopulateContext(context))
    }

    // Custom Redwood plugins
    plugins.push(...redwoodDirectivePlugins)

    // Custom Redwood OpenTelemetry plugin
    plugins.push(useRedwoodOpenTelemetry())

    // Secure the GraphQL server
    plugins.push(useArmor(logger, armorConfig))

    // Only allow execution of specific operation types
    const defaultAllowedOperations = [
      OperationTypeNode.QUERY,
      OperationTypeNode.MUTATION,
    ]

    // now allow subscriptions if using them (unless you override)
    if (realtime?.subscriptions?.subscriptions) {
      defaultAllowedOperations.push(OperationTypeNode.SUBSCRIPTION)
    } else {
      logger.info('Subscriptions are disabled.')
    }

    plugins.push(
      useFilterAllowedOperations(allowedOperations || defaultAllowedOperations)
    )

    if (realtime) {
      plugins.push(useRedwoodRealtime(realtime))
    }

    // App-defined plugins
    if (extraPlugins && extraPlugins.length > 0) {
      plugins.push(...extraPlugins)
    }

    plugins.push(useRedwoodError(logger))

    plugins.push(
      useReadinessCheck({
        endpoint: graphiQLEndpoint + '/readiness',
        check: async ({ request }) => {
          try {
            // if we can reach the health check endpoint ...
            const response = await yoga.fetch(
              new URL(graphiQLEndpoint + '/health', request.url)
            )

            const expectedHealthCheckId = healthCheckId || 'yoga'

            // ... and the health check id's match the request and response's
            const status =
              response.headers.get('x-yoga-id') === expectedHealthCheckId &&
              request.headers.get('x-yoga-id') === expectedHealthCheckId

            // then we're good to go (or not)
            return status
          } catch (err) {
            logger.error(err)
            return false
          }
        },
      })
    )

    // Must be "last" in plugin chain, but before error masking
    // so can process any data added to results and extensions
    plugins.push(useRedwoodLogger(loggerConfig))

    logger.debug(
      {
        healthCheckId,
        allowedOperations,
        defaultAllowedOperations,
        allowIntrospection,
        defaultError,
        disableIntrospection,
        disableGraphQL,
        allowGraphiQL,
        graphiql,
        graphiQLEndpoint,
      },
      'GraphiQL and Introspection Config'
    )
    const yoga = createYoga({
      id: healthCheckId,
      landingPage: isDevEnv,
      schema,
      plugins,
      maskedErrors: {
        errorMessage: defaultError,
        isDev: isDevEnv,
      },
      logging: logger,
      healthCheckEndpoint: graphiQLEndpoint + '/health',
      graphqlEndpoint: graphiQLEndpoint,
      graphiql,
      cors: (request: Request) => {
        const requestOrigin = request.headers.get('origin')
        return mapRwCorsOptionsToYoga(cors, requestOrigin)
      },
    })

    return { yoga, logger }
  } catch (e) {
    onException && onException()
    throw e
  }
}
