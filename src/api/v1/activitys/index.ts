import { FastifyInstance } from "fastify";
import { Filter } from './_filter';


export async function Activitys_V1(fastify: FastifyInstance) {
    fastify.route({
        method: "GET",
        url: "/activitys",
        handler: Filter
    })
}
