import { FastifyInstance } from "fastify";
import { Filter } from './_filter';
import { Get } from "./_get";
// import { Create } from "./_create";
import { Update } from "./_update";



export async function Characters_V1(fastify: FastifyInstance) {
    fastify.route({
        method: "GET",
        url: "/characters",
        handler: Filter
    })
    fastify.route({
        method: "GET",
        url: "/characters/:id",
        handler: Get
    })
    // fastify.route({
    //     method: "POST",
    //     url: "/characters/create",
    //     handler: Create
    // })
    fastify.route({
        method: "POST",
        url: "/characters/:id",
        handler: Update
    })
}
