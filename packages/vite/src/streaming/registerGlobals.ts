import path from 'node:path'

import { getConfig, getPaths } from '@redwoodjs/project-config'

/**
 * Use this function on the web server
 *
 * Because although this is defined in Vite/index.ts
 * They are only available in the user's code (and not in FW code)
 * because define STATICALLY replaces it in user's code, not in node_modules
 *
 * It's still available on the client side though, probably because its processed by Vite
 */
export const registerFwGlobals = () => {
  const rwConfig = getConfig()
  const rwPaths = getPaths()

  globalThis.RWJS_ENV = {
    // @NOTE we're avoiding process.env here, unlike webpack
    RWJS_API_GRAPHQL_URL:
      rwConfig.web.apiGraphQLUrl ?? rwConfig.web.apiUrl + '/graphql',
    RWJS_API_URL: rwConfig.web.apiUrl,
    __REDWOOD__APP_TITLE: rwConfig.web.title || path.basename(rwPaths.base),
    RWJS_EXP_STREAMING_SSR:
      rwConfig.experimental.streamingSsr &&
      rwConfig.experimental.streamingSsr.enabled,
    RWJS_EXP_RSC: rwConfig.experimental?.rsc?.enabled,
    RWJS_EXP_SSR_GRAPHQL_ENDPOINT: (() => {
      const apiPath =
        rwConfig.web.apiGraphQLUrl ?? rwConfig.web.apiUrl + '/graphql'

      // If its an absolute url, use as is
      if (/^[a-zA-Z][a-zA-Z\d+\-.]*?:/.test(apiPath)) {
        return apiPath
      } else {
        return (
          'http://' + rwConfig.api.host + ':' + rwConfig.api.port + '/graphql'
        )
      }
    })(),
  }

  globalThis.RWJS_DEBUG_ENV = {
    RWJS_SRC_ROOT: rwPaths.web.src,
    REDWOOD_ENV_EDITOR: JSON.stringify(process.env.REDWOOD_ENV_EDITOR),
  }
}
