import { ApolloServer, BaseContext } from "@apollo/server";
import fastifyApollo, { fastifyApolloDrainPlugin, fastifyApolloHandler } from "@as-integrations/fastify";
import { GraphQLFileLoader } from "@graphql-tools/graphql-file-loader";
import { loadSchemaSync } from "@graphql-tools/load";
import { FastifyInstance, FastifyServerOptions } from "fastify";
import { GraphQLScalarType, Kind } from "graphql";
import * as Medias from '../models';
import { CompanyRequestModel } from "../classes/companys/Company.db";

export async function ApolloFatifyPlugin(fastify: FastifyInstance, options: FastifyServerOptions, done: () => void) {


    // let test = new CompanyRequestModel({ label: 'Test', name: 'TEST', siteUrl: 'test' });

    // await test.validate();
    // console.log(test)
    // // await test.save();

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

    const schema = loadSchemaSync(['./src/models/**/*.gql', './src/models/*.gql'], {
        loaders: [new GraphQLFileLoader()],
    })

    const apollo = new ApolloServer<BaseContext>({
        typeDefs: schema,
        resolvers: { Date: DateScalar, ...Medias.resolvers },
        plugins: [fastifyApolloDrainPlugin(fastify)],
        introspection: true,

    })

    await apollo.start();

    fastify.route({
        url: "/gql",
        method: ["POST", "OPTIONS"],
        handler: fastifyApolloHandler(apollo),
    });

    done();
}