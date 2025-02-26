import { FastifyInstance } from "fastify";

export const OnListenHook = async (fastify: FastifyInstance) => {
    fastify.addHook('onListen', async () => {
        console.info(`Le serveur écoute sur`, fastify.server.address());
    })
}