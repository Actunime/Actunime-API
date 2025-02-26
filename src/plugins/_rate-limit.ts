import { FastifyInstance } from 'fastify';
import fastifyRateLimit from '@fastify/rate-limit';

const RateLimitPlugin = async (fastify: FastifyInstance) => {
    await fastify.register(fastifyRateLimit, {
        global: true,
        max: 100,
        timeWindow: 60 * 1000,
    });
};

export { RateLimitPlugin };