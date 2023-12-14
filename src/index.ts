import "reflect-metadata";
import { ApolloServer, BaseContext } from "@apollo/server";
import Fastify from 'fastify';
import mongoose from 'mongoose';
import { createFakeData } from "./helpers.db";
import { buildSchema } from "type-graphql";
import path from "path";
import { TypegooseMiddleware } from "./typegoose.middleware";
import { fastifyApolloDrainPlugin, fastifyApolloHandler } from "@as-integrations/fastify";
import cors from "@fastify/cors";
import * as Medias from "./medias";
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
    await mongoose.connect('mongodb://192.168.1.39:27017', {
        user: 'apiaccess',
        pass: '8#tM*^J&K%T!*N',
        dbName: 'Actunime',
        autoIndex: true,
        autoCreate: true
    });

    await mongoose.connection.db.dropDatabase();
}

try {

    (async () => {
        await connectDB();
        await createFakeData();

        // await mongoose.connection.db.collection('animemedias').dropIndexes();
        let colls = await mongoose.connection.collections;
        console.log(colls)
        let indexes = await mongoose.connection.db.collection('animemedias').indexInformation();
        console.log(indexes);


        const schema = await buildSchema({
            resolvers: [Medias.AnimeResolver],
            emitSchemaFile: path.resolve(__dirname, "schema.graphql"),
            globalMiddlewares: [TypegooseMiddleware],
            validate: false,
        });

        const fastify = Fastify({
            logger: true
        })

        fastify.register(cors);

        const apollo = new ApolloServer<BaseContext>({
            schema,
            plugins: [fastifyApolloDrainPlugin(fastify)],
            introspection: true,
        });

        await apollo.start();

        fastify.route({
            url: "/gql",
            method: ["POST", "OPTIONS"],
            handler: fastifyApolloHandler(apollo),
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