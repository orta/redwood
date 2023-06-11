import {
  Plugin,
  handleStreamOrSingleExecutionResult,
  createGraphQLError,
} from 'graphql-yoga'

import { RedwoodError } from '@redwoodjs/api'
import type { Logger } from '@redwoodjs/api/logger'

import { RedwoodGraphQLContext } from '../types'

/**
 * Converts RedwoodErrors to GraphQLErrors
 *
 * This is a workaround for the fact that graphql-yoga doesn't support custom error types.
 *
 * Yoga automatically masks unexpected errors and prevents leaking sensitive information to clients.
 *
 * Since RedwoodErrors (such as ServiceValidation errors) are expected,
 * we need to convert them to GraphQLErrors so that they are not masked.
 *
 * See: https://the-guild.dev/graphql/yoga-server/docs/features/error-masking
 *
 * @param logger
 * @returns ExecutionResult
 */
export const useRedwoodError = (
  logger: Logger
): Plugin<RedwoodGraphQLContext> => {
  return {
    async onExecute() {
      return {
        onExecuteDone(payload) {
          return handleStreamOrSingleExecutionResult(
            payload,
            ({ result, setResult }) => {
              const errors = result.errors?.map((error) => {
                if (
                  error.originalError &&
                  error.originalError instanceof RedwoodError
                ) {
                  logger.debug(
                    { custom: { name: error.originalError.name } },
                    'Converting RedwoodError to GraphQLError'
                  )
                  return createGraphQLError(error.message, {
                    extensions: error.extensions,
                    originalError: error,
                  })
                } else {
                  return error
                }
              })

              setResult({
                data: result.data,
                errors,
                extensions: result.extensions || {},
              })
            }
          )
        },
      }
    },
  }
}
