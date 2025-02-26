import { FastifyInstance } from "fastify";
import { removeSessionHandler } from "../_utils";

export const OnResponseHook = async (fastify: FastifyInstance) => {
    fastify.addHook('onResponse', async (request, reply) => {
        await removeSessionHandler(request, reply);
    })
}