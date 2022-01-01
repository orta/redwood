import { mergeTypeDefs } from '@graphql-tools/merge'
import {
  addResolversToSchema,
  makeExecutableSchema,
  IExecutableSchemaDefinition,
} from '@graphql-tools/schema'
import { IResolvers } from '@graphql-tools/utils'
import type { GraphQLSchema, GraphQLFieldMap, DocumentNode } from 'graphql'
import merge from 'lodash.merge'
import omitBy from 'lodash.omitby'

import type { RedwoodDirective } from '../plugins/useRedwoodDirective'
import * as rootGqlSchema from '../rootSchema'
import {
  Services,
  ServicesGlobImports,
  GraphQLTypeWithFields,
  SdlGlobImports,
} from '../types'

const mapFieldsToService = ({
  fields = {},
  resolvers: unmappedResolvers,
  services,
}: {
  fields: GraphQLFieldMap<any, any>
  resolvers: {
    [key: string]: (
      root: unknown,
      args: unknown,
      context: unknown,
      info: unknown
    ) => any
  }
  services: Services
}) =>
  Object.keys(fields).reduce((resolvers, name) => {
    // Does the function already exist in the resolvers from the schema definition?
    if (resolvers?.[name]) {
      return resolvers
    }

    // Does a function exist in the service?
    if (services?.[name]) {
      return {
        ...resolvers,
        // Map the arguments from GraphQL to an ordinary function a service would
        // expect.
        [name]: (
          root: unknown,
          args: unknown,
          context: unknown,
          info: unknown
        ) => services[name](args, { root, context, info }),
      }
    }

    return resolvers
  }, unmappedResolvers)

/**
 * This iterates over all the schemas definitions and figures out which resolvers
 * are missing, it then tries to add the missing resolvers from the corresponding
 * service.
 */
const mergeResolversWithServices = ({
  schema,
  resolvers,
  services,
}: {
  schema: GraphQLSchema
  resolvers: { [key: string]: any }
  services: ServicesGlobImports
}): IResolvers => {
  const mergedServices = merge(
    {},
    ...Object.keys(services).map((name) => services[name])
  )

  // Get a list of types that have fields.
  // TODO: Figure out if this would interfere with other types: Interface types, etc.`
  const typesWithFields = Object.keys(schema.getTypeMap())
    .filter((name) => !name.startsWith('_'))
    .filter(
      (name) =>
        typeof (schema.getType(name) as GraphQLTypeWithFields).getFields !==
        'undefined'
    )
    .map((name) => {
      return schema.getType(name)
    })
    .filter(
      (type): type is GraphQLTypeWithFields =>
        type !== undefined && type !== null
    )

  const mappedResolvers = typesWithFields.reduce((acc, type) => {
    // Services export Query and Mutation field resolvers as named exports,
    // but other GraphQLObjectTypes are exported as an object that are named
    // after the type.
    // Example: export const MyType = { field: () => {} }
    let servicesForType = mergedServices
    if (!['Query', 'Mutation'].includes(type.name)) {
      servicesForType = mergedServices?.[type.name]
    }

    return {
      ...acc,
      [type.name]: mapFieldsToService({
        fields: type.getFields(),
        resolvers: resolvers?.[type.name],
        services: servicesForType,
      }),
    }
  }, {})

  return omitBy(
    {
      ...resolvers,
      ...mappedResolvers,
    },
    (v) => typeof v === 'undefined'
  )
}

const mergeResolvers = (schemas: {
  [key: string]: {
    schema: DocumentNode
    resolvers: Record<string, unknown>
  }
}) =>
  omitBy(
    merge(
      {},
      ...[
        rootGqlSchema.resolvers,
        ...Object.values(schemas).map(({ resolvers }) => resolvers),
      ]
    ),
    (v) => typeof v === 'undefined'
  )

/**
 * Merge GraphQL typeDefs and resolvers into a single schema.
 *
 * @example
 * ```js
 * const schemas = importAll('api', 'graphql')
 * const services = importAll('api', 'services')
 *
 * const schema = makeMergedSchema({
 *  schema,
 *  services,
 * })
 * ```
 */

/**
 * Update January 2021
 * Merge GraphQL Schemas has been replaced by @graphql-toolkit/schema-merging
 * The following code proxies the original mergeTypes to the new mergeTypeDefs
 * https://www.graphql-tools.com/docs/migration-from-merge-graphql-schemas/
 **/

type Config = Parameters<typeof mergeTypeDefs>[1]

const mergeTypes = (
  types: any[],
  options?: { schemaDefinition?: boolean; all?: boolean } & Partial<Config>
) => {
  const schemaDefinition =
    options && typeof options.schemaDefinition === 'boolean'
      ? options.schemaDefinition
      : true

  return mergeTypeDefs(types, {
    useSchemaDefinition: schemaDefinition,
    forceSchemaDefinition: schemaDefinition,
    throwOnConflict: true,
    commentDescriptions: true,
    reverseDirectives: true,
    ...options,
  })
}

export const makeMergedSchema = ({
  sdls,
  services,
  schemaOptions = {},
  directives,
}: {
  sdls: SdlGlobImports
  services: ServicesGlobImports
  directives: RedwoodDirective[]

  /**
   * A list of options passed to [makeExecutableSchema](https://www.graphql-tools.com/docs/generate-schema/#makeexecutableschemaoptions).
   */
  schemaOptions?: Partial<IExecutableSchemaDefinition>
}) => {
  const sdlSchemas = Object.values(sdls).map(({ schema }) => schema)

  const typeDefs = mergeTypes(
    [
      rootGqlSchema.schema,
      ...directives.map((directive) => directive.schema), // pick out schemas from directives
      ...sdlSchemas, // pick out the schemas from sdls
    ],
    { all: true }
  )

  const { typeDefs: schemaOptionsTypeDefs = [], ...otherSchemaOptions } =
    schemaOptions
  const schema = makeExecutableSchema({
    typeDefs: [typeDefs, schemaOptionsTypeDefs],
    ...otherSchemaOptions,
  })

  const resolvers: IResolvers = mergeResolversWithServices({
    schema,
    resolvers: mergeResolvers(sdls),
    services,
  })

  const { resolverValidationOptions, inheritResolversFromInterfaces } =
    schemaOptions || {}

  return addResolversToSchema({
    schema,
    resolvers,
    resolverValidationOptions,
    inheritResolversFromInterfaces,
  })
}
