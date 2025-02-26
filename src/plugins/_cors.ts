import { FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';

const CorsPlugin = async (fastify: FastifyInstance) => {
    await fastify.register(fastifyCors, {
        origin: (origin, cb) => {
            const checkOrigin = (url: string | undefined): boolean => {
                const hostname = url ? new URL(url).hostname : '';
                return ['localhost', 'actunime.fr'].includes(hostname);
            };
            if (checkOrigin(origin))
                return cb(null, true);
            console.log("Origin", origin, "ERRRUR BLOQUAGE");
            return cb(null, false);
        },
    });
};

export { CorsPlugin };