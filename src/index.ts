import 'dotenv/config'
import Fastify from "fastify";
import Mercurius from "mercurius";
import { AuthRoutes } from './routes/auth';
import fastifyFormbody from "@fastify/formbody";
import { MercuriusConfig, connectDB } from './lib';
import { ApolloFatifyPlugin } from './lib/_apollo';
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import compress from "@fastify/compress";
// Connexion a la base de donnée
connectDB();

const API = Fastify({ bodyLimit: 7340032, logger: true });
API.register(fastifyFormbody);

// Documentation API graphql auto généré.
// API.register(fastifyStatic, {
//     root: path.join(__dirname, '../gqlDoc'),
//     // prefix: '/public/', // optional: default '/'
//     // constraints: { host: 'example.com' } // optional: default {}
// })

// Envoie de la documentation
// API.get('/', (req, res) => {
//     // const stream = fs.createReadStream(path.join('./gqlDoc/index.html'))
//     // res.type('text/html').send(stream)
//     // res.sendFile('index.html') 
//     res.status(404).send();
// })

API.register(rateLimit);
API.register(helmet);
API.register(cors);
API.register(compress);


API.register(ApolloFatifyPlugin, { prefix: '/v1' });

// Gestion de l'initialisation et configuration de graphql;
// API.register(Mercurius, MercuriusConfig('/v1/gql', true));

// Routes de gestion de token
API.register(AuthRoutes, { prefix: '/v1' });

// Lancement du serveur sur port d'écoute.
API.listen({ port: 3002 }, (err, address) => {
    if (err) throw err;
    console.log('API en ligne sur le port %s', address);
})