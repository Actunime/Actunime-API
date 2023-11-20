import { GraphQLFileLoader } from "@graphql-tools/graphql-file-loader";
import { loadSchemaSync } from "@graphql-tools/load";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { GraphQLScalarType, GraphQLSchema, Kind } from "graphql";
import { MercuriusOptions } from "mercurius";
import * as Medias from '../models';

const DateScalar = new GraphQLScalarType({
    name: 'Date',
    description: 'Une Date complète.',
    serialize(value: any) {
        return value.toString();
    },
    parseValue(value: any) {
        return new Date(value);
    },
    parseLiteral(ast: any) {
        if (ast.kind === Kind.INT) {
            return new Date(parseInt(ast.value, 10));
        }
        if (ast.kind === Kind.STRING) {
            return new Date(ast.value);
        }
        return null;
    },
});

// Récupération de tous les fichier .gql;
const schema = loadSchemaSync(['./src/models/**/*.gql', './src/models/*.gql'], {
    loaders: [new GraphQLFileLoader()],
})

const schemaExecutable: GraphQLSchema = makeExecutableSchema({
    typeDefs: schema,
    resolvers: { Date: DateScalar, ...Medias.resolvers },
})

const authContext: typeof config.context = function (req, res) {
    // let auth = req.headers.authorization;
    return {}
}

const config: MercuriusOptions = {
    path: '/gql',
    schema: schemaExecutable,
    graphiql: true,
    context: authContext
}

export const MercuriusConfig = (
    /**\/gql par defaut */
    path?: string,
    /**True par defaut */
    graphiql?: boolean) => {
    return { ...config, path, graphiql };
}