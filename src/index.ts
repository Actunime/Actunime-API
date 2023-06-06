import 'dotenv/config'
import mongoose from 'mongoose';
import AutoIncrement from './autoIncrementPlugin';
import Fastify from "fastify";
import Mercurius from "mercurius";
import { loadSchemaSync } from '@graphql-tools/load'
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { GraphQLScalarType, Kind } from 'graphql';
import { makeExecutableSchema } from '@graphql-tools/schema';
import * as Medias from './models';
// import fs from 'fs';
// import path from 'path';
// import fastifyStatic from '@fastify/static';
// import * as models from './models';


mongoose.connection.on('connected', async () => {
    console.log('DB: Connecté');
    await AutoIncrement.initialise();
});

mongoose.connection.on('disconnected', () => {
    console.log('DB: Déconnecté');
});

// mongoose.connect(process.env.mongodb_uri as string, {
// mongoose.connect('mongodb://devlerito:devlerito@192.168.1.63:27017', {
//     dbName: 'Actunime',
//     autoIndex: false,
//     autoCreate: true
// });


const API = Fastify({ bodyLimit: 7340032, logger: true });

// API.register(fastifyStatic, {
//     root: path.join(__dirname, '../gqlDoc'),
//     // prefix: '/public/', // optional: default '/'
//     // constraints: { host: 'example.com' } // optional: default {}
// })

const schema = loadSchemaSync(['./src/models/**/*.gql', './src/models/*.gql'], {
    loaders: [new GraphQLFileLoader()],
})

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


API.register(Mercurius, {
    // schema,
    schema: makeExecutableSchema({
        typeDefs: schema,
        // typeDefs: [`
        // enum StudiosEnums {
        //     ${studios.map((s) => "_" + s.name.split(' ').join('_').split('-').join('_').split("'").join('_').split("é").join('e')).join('\n')}
        //   }
        //   ${printSchema(schema)}
        // `],

        resolvers: { Date: DateScalar, ...Medias.resolvers },
    }),
    // resolvers: { Date: DateScalar, ...resolvers },
    graphiql: true,

    context: async (req, res) => {

        let auth = req.headers.authorization;

        if (auth) {
            // let token = await models.Token.default.findOne({ token: auth });
            // if (!token) throw "Authorization token invalide.";

            // const user = await models.User.default.findById(token.userID);
            // await req.logIn(user, { session: false });
            // return { usingAccesToken: true };
        }

        return { usingAccesToken: false };
    },

})

API.get('/', (req, res) => {
    // const stream = fs.createReadStream(path.join('./gqlDoc/index.html'))
    // res.type('text/html').send(stream)
    // res.sendFile('index.html') 
    res.status(404).send();
})

API.listen({ port: 3001 }, (err, address) => {
    if (err) throw err;
    console.log('API en ligne sur le port %s', address);
})