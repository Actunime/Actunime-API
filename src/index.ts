import "reflect-metadata";
import { ApolloServer, BaseContext } from "@apollo/server";
import Fastify from 'fastify';
import mongoose from 'mongoose';
import { buildSchema } from "type-graphql";
import path from "path";
import { TypegooseMiddleware } from "./typegoose.middleware";
import { ApolloFastifyContextFunction, fastifyApolloDrainPlugin, fastifyApolloHandler } from "@as-integrations/fastify";
import cors from "@fastify/cors";
// import { AnimeResolver, CharacterResolver, CompanyResolver, TrackResolver, PersonResolver, GroupeResolver } from "./medias";
import { IUserRoles, UserModel } from "./medias/users/_user.type";
import JWT from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import { authChecker } from "./auth/AuthChecker";
import { DefaultDataResolver } from "./medias/defaultData";
import { AnimeResolver } from "./medias/animes";
import { createFakeData } from "./helpers.db";

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
    await mongoose.connect('mongodb://192.168.1.37:27017', {
        user: 'API_ACCES',
        pass: '8#tM*^J&K%T!*N',
        dbName: 'Actunime',
        autoIndex: true,
        autoCreate: true
    });

    // await mongoose.connection.db.dropDatabase();
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

        const schema = await buildSchema({
            // resolvers: [AnimeResolver, GroupeResolver, DefaultDataResolver],
            resolvers: [AnimeResolver, DefaultDataResolver],
            emitSchemaFile: path.resolve(__dirname, "schema.graphql"),
            globalMiddlewares: [TypegooseMiddleware],
            validate: false,
            authChecker
        });

        const fastify = Fastify({
            logger: true
        })

        fastify.register(cors);


        const apollo = new ApolloServer<ActunimeAuthContext>({
            schema,
            plugins: [fastifyApolloDrainPlugin(fastify)],
            introspection: true,
        });

        const contextFunc: ApolloFastifyContextFunction<ActunimeAuthContext> = async (req) => {

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

                const checkedToken = JWT.verify(authorization, process.env.TCODE as string) as { userId: string, expires_at: string };

                if (!checkedToken) {
                    return {
                        logged,
                        authorization,
                        roles: []
                    }
                }

                const user = await UserModel.findById(checkedToken.userId);

                if (!user) {
                    return {
                        logged,
                        authorization,
                        roles: []
                    }
                }

                logged = true;

                return {
                    logged,
                    authorization: req.headers.authorization,
                    userId: user.id,
                    userPubId: user.pubId,
                    username: user.username,
                    roles: user.roles || []
                }

            } catch (err: any) {
                console.log("contextFunc", err.toString());
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
            fastify.listen({ port: 3000 }).then(() => console.log('API En ligne sur le port 3000'))
        } catch (err) {
            fastify.log.error(err)
            process.exit(1)
        }
    })();


} catch (err) {
    console.error(err);
}

process.on('uncaughtException', (err) => console.error(err.message, err));