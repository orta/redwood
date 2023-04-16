import { CodeFileLoader } from '@graphql-tools/code-file-loader'
import { loadTypedefs } from '@graphql-tools/load'
import { mergeTypeDefs } from '@graphql-tools/merge'
import { DocumentNode, Kind, ObjectTypeDefinitionNode, visit } from 'graphql'

import { rootSchema } from '@redwoodjs/graphql-server'
import { getPaths } from '@redwoodjs/project-config'

export const DIRECTIVE_REQUIRED_ERROR_MESSAGE =
  'You must specify one of @requireAuth, @skipAuth or a custom directive'

export const DIRECTIVE_INVALID_ROLE_TYPES_ERROR_MESSAGE =
  'Please check that the requireAuth roles is a string or an array of strings.'
export function validateSchemaForDirectives(
  schemaDocumentNode: DocumentNode,
  typesToCheck: string[] = ['Query', 'Mutation']
) {
  const validationOutput: string[] = []
  const directiveRoleValidationOutput: Record<string, any> = []

  visit(schemaDocumentNode, {
    ObjectTypeDefinition(typeNode) {
      if (typesToCheck.includes(typeNode.name.value)) {
        for (const field of typeNode.fields ||
          ([] as ObjectTypeDefinitionNode[])) {
          const fieldName = field.name.value
          const fieldTypeName = typeNode.name.value

          const isRedwoodQuery =
            fieldName === 'redwood' && fieldTypeName === 'Query'
          const isCurrentUserQuery =
            fieldName === 'currentUser' && fieldTypeName === 'Query'
          // skip validation for redwood query and currentUser
          if (!(isRedwoodQuery || isCurrentUserQuery)) {
            const hasDirective = field.directives?.length

            if (!hasDirective) {
              validationOutput.push(`${fieldName} ${fieldTypeName}`)
            }

            // we want to check that the requireAuth directive roles argument value
            // is a string or an array of strings
            field.directives?.forEach((directive) => {
              if (directive.name.value === 'requireAuth') {
                directive.arguments?.forEach((arg) => {
                  if (arg.name.value === 'roles') {
                    if (
                      arg.value.kind !== Kind.STRING &&
                      arg.value.kind !== Kind.LIST
                    ) {
                      directiveRoleValidationOutput.push({
                        fieldName: fieldName,
                        invalid: arg.value.kind,
                      })
                    }

                    // check list (array)
                    if (arg.value.kind === Kind.LIST) {
                      const invalidValues = arg.value.values?.filter(
                        (val) => val.kind !== Kind.STRING
                      )
                      if (invalidValues.length > 0) {
                        invalidValues.forEach((invalid) => {
                          directiveRoleValidationOutput.push({
                            fieldName: fieldName,
                            invalid: invalid.kind,
                          })
                        })
                      }
                    }
                  }
                })
              }
            })
          }
        }
      }
    },
  })

  if (validationOutput.length > 0) {
    const fieldsWithoutDirectives = validationOutput.map(
      (field) => `- ${field}`
    )

    throw new Error(
      `${DIRECTIVE_REQUIRED_ERROR_MESSAGE} for\n${fieldsWithoutDirectives.join(
        '\n'
      )} \n`
    )
  }

  if (directiveRoleValidationOutput.length > 0) {
    const fieldWithInvalidRoleValues = directiveRoleValidationOutput.map(
      (field: Record<string, any>) =>
        `- ${field.fieldName} has an invalid ${field.invalid}`
    )

    throw new RangeError(
      `${DIRECTIVE_INVALID_ROLE_TYPES_ERROR_MESSAGE}\n\n${fieldWithInvalidRoleValues.join(
        '\n'
      )} \n\nFor example: @requireAuth(roles: "admin") or @requireAuth(roles: ["admin", "editor"])`
    )
  }
}

export const loadAndValidateSdls = async () => {
  const projectTypeSrc = await loadTypedefs(
    ['graphql/**/*.sdl.{js,ts}', 'directives/**/*.{js,ts}'],
    {
      loaders: [
        new CodeFileLoader({
          noRequire: true,
          pluckConfig: {
            globalGqlIdentifierName: 'gql',
          },
        }),
      ],
      cwd: getPaths().api.src,
    }
  )

  // The output of the above function doesn't give us the documents directly
  const projectDocumentNodes = Object.values(projectTypeSrc)
    .map(({ document }) => document)
    .filter((documentNode): documentNode is DocumentNode => {
      return !!documentNode
    })

  // Merge in the rootSchema with JSON scalars, etc.
  const mergedDocumentNode = mergeTypeDefs([
    rootSchema.schema,
    projectDocumentNodes,
  ])

  validateSchemaForDirectives(mergedDocumentNode)
}
