import "reflect-metadata";
import { ApolloServer, BaseContext } from "@apollo/server";
import Fastify from 'fastify';
import mongoose from 'mongoose';
import { buildSchema } from "type-graphql";
import path from "path";
import { TypegooseMiddleware } from "./typegoose.middleware";
import { ApolloFastifyContextFunction, fastifyApolloDrainPlugin, fastifyApolloHandler } from "@as-integrations/fastify";
import cors from "@fastify/cors";
import { AnimeResolver, CharacterResolver, CompanyResolver, TrackResolver, PersonResolver, GroupeResolver, UserResolver } from "./medias";
import { IUserRoles } from "./medias/users/_user.type";
import JWT from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import { authChecker } from "./auth/AuthChecker";
import { DefaultDataResolver } from "./medias/defaultData";
import { createFakeData } from "./helpers.db";
import { UserModel } from "./medias/users/_user.model";

dotenv.config();
// import cache from 'ts-cache-mongoose'

// cache.init(mongoose, {
//     defaultTTL: '60 seconds',
//     engine: 'memory',
// })

mongoose.connection.on('connected', async () => {
    console.log('Base de donnée :(', 'Actunime', ') est connecté !');
});

mongoose.connection.on('disconnected', () => {
    console.log('Base de donnée :(', 'Actunime', ") s'est déconnecté !");
});

async function connectDB() {
    await mongoose.connect('mongodb://192.168.1.49:27017', {
        user: 'API_ACCES',
        pass: '8#tM*^J&K%T!*N',
        dbName: 'Actunime',
        autoIndex: true,
        autoCreate: true
    });

    await mongoose.connection.db.dropDatabase();
}

export interface ActunimeAuthContext {
    logged?: boolean
    authorization?: string;
    userId?: string,
    userPubId?: string,
    username?: string,
    roles: IUserRoles[]
}

try {

    (async () => {
        await connectDB().catch((err) => console.error(err));
        await createFakeData();

        // await mongoose.connection.db.collection('animemedias').dropIndexes();
        // let colls = await mongoose.connection.collections;
        // console.log(colls)
        // let indexes = await mongoose.connection.db.collection('animes').indexInformation();
        // console.log(indexes);

        // TODO! https://github.com/MichalLytek/type-graphql/tree/v2.0.0-beta.6/examples/apollo-cache
        const schema = await buildSchema({
            resolvers: [AnimeResolver, CharacterResolver, CompanyResolver, TrackResolver, PersonResolver, GroupeResolver, UserResolver ],
            emitSchemaFile: path.resolve(__dirname, "schema.graphql"),
            globalMiddlewares: [TypegooseMiddleware],
            validate: false,
            authChecker,

        });

        const fastify = Fastify({
            logger: true
        })

        fastify.register(cors);


        const apollo = new ApolloServer<ActunimeAuthContext>({
            schema,
            plugins: [fastifyApolloDrainPlugin(fastify)],
            introspection: true,
            allowBatchedHttpRequests: true
        });

        const contextFunc: ApolloFastifyContextFunction<ActunimeAuthContext> = async (req, res) => {

            try {

                var logged = false;
                var authorization = req.headers.authorization;

                if (!authorization) {
                    return {
                        logged,
                        authorization,
                        roles: []
                    }
                }

                const checkedToken = JWT.verify(authorization, process.env.APIAUTH_SECRET as string) as { userId: string, expires_at: string };

                if (!checkedToken) {
                    return {
                        logged,
                        roles: []
                    }
                }

                const user = await UserModel.findOne({ id: checkedToken.userId, sessions: { $elemMatch: { accessToken: authorization } } });

                if (!user) {
                    return {
                        logged,
                        roles: []
                    }
                }

                console.log('Authentificated User', user.username, user.id);

                logged = true;

                return {
                    logged,
                    userId: user.id,
                    userPubId: user.id,
                    username: user.username,
                    roles: user.roles || []
                }

            } catch (err: any) {
                console.error("contextFunc", err.toString());
                return {
                    roles: []
                }
            }
        }

        await apollo.start();

        fastify.route({
            url: "/gql",
            method: ["POST", "OPTIONS", "GET"],
            handler: fastifyApolloHandler(apollo, { context: contextFunc }),
        });

        try {
            fastify.listen({ port: 3001 }).then(() => console.log('API En ligne sur le port 3001'))
        } catch (err) {
            fastify.log.error(err)
            process.exit(1)
        }
    })();


} catch (err) {
    console.error(err);
}

process.on('uncaughtException', (err) => console.error(err.message, err));




/**
 * ? Pour la V2
 * Possibilité de simplifié la structure des médias car on peut précisiser le nom
 * Des Model/Schema pour les types de données dans ex: @ObjectType(Media.name + "Request")
 * 
 */