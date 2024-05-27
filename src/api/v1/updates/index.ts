import { FastifyInstance } from "fastify";
import { Filter } from './_filter';
import { Get } from "./_get";
// import { Create } from "./_create";
import { Update } from "./_update";



export async function Updates_V1(fastify: FastifyInstance) {
    fastify.route({
        method: "GET",
        url: "/updates",
        handler: Filter
    })
    fastify.route({
        method: "GET",
        url: "/updates/:id",
        handler: Get
    })
    // fastify.route({
    //     method: "POST",
    //     url: "/updates/create",
    //     handler: Create
    // })
    fastify.route({
        method: "POST",
        url: "/updates/:id",
        handler: Update
    })
}
