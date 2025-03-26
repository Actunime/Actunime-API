import { FastifyInstance } from "fastify";

export const OnReadyHook = async (fastify: FastifyInstance) => {
    fastify.addHook('onReady', async () => {

    })
}