import fastifyStatic from '@fastify/static';
import { FastifyInstance } from 'fastify';
import path from 'path';

const StaticPlugin = async (fastify: FastifyInstance) => {
    await fastify.register(fastifyStatic, {
        root: path.join(__dirname, '..', '..', 'public')
    })
}

export { StaticPlugin };