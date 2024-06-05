import dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

import Fastify from 'fastify';
import { connectDB } from './_utils/mongoose';
import * as v1 from './api/v1';
import Fastify_RateLimit from "@fastify/rate-limit";
import Fastify_Cors from "@fastify/cors";

(async () => {

    const fastify = Fastify({
        logger: true
    })

    // const checkOrigin = (url: string | undefined): boolean => {
    //     const hostname = url ? new URL(url).hostname : '';
    //     return ["localhost", "actunime.fr"].includes(hostname);
    // }

    fastify
        // .register(Fastify_Cors, {
        //     origin: (origin, cb) => {
        //         console.log("Origine", origin);
        //         if (checkOrigin(origin))
        //             return cb(null, true);
        //         return cb(null, false);
        //     },
        //     // credentials: true
        // })
        .register(Fastify_RateLimit, {
            global: false,
            max: 100,
            errorResponseBuilder: (req, context) => {
                return {
                    code: 429,
                    error: 'Too Many Requests',
                    message: `Vous avez dépassé la limite de ${context.max} requêtes par ${context.after}, ressayer plus tard.`,
                    date: Date.now(),
                    expiresIn: context.ttl
                }
            }
        })

    try {
        await connectDB();

        console.log("BIEN MODIFIE")
        fastify.get('/', async (request, reply) => {
            console.log("request from", request.ip);
            return { hello: 'world' }
        })

        for await (const [key, route] of Object.entries(v1)) {
            await fastify.register(route, { prefix: '/v1' });
            console.log('Route', key, "chargé!");
        }

        await fastify.listen({ port: 3001 });
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }

})();

