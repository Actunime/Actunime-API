import { FastifyInstance } from "fastify";
import { Filter } from './_filter';
import { Get } from "./_get";
// import { Create } from "./_create";
import { Update } from "./_update";



export async function Users_V1(fastify: FastifyInstance) {
    fastify.route({
        method: "GET",
        url: "/users",
        handler: Filter
    })
    fastify.route({
        method: "GET",
        url: "/users/:id",
        handler: Get
    })
    fastify.route({
        method: "POST",
        url: "/users/:id",
        handler: Update
    })
}
