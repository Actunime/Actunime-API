import fastifyFormbody from '@fastify/formbody';
import { FastifyInstance } from 'fastify';

export const FormBodyPlugin = async (fastify: FastifyInstance) => {
    await fastify.register(fastifyFormbody);
}

export { fastifyFormbody }