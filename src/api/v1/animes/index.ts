import { FastifyInstance } from "fastify";
import { Filter } from './_filter';
import { Get } from "./_get";
import { Create } from "./_create";
import { Update } from "./_update";



export async function Animes_V1(fastify: FastifyInstance) {
    fastify.route({
        method: "GET",
        url: "/animes",
            
        handler: Filter
    })
    fastify.route({
        method: "GET",
        url: "/animes/:id",
        handler: Get
    })
    fastify.route({
        method: "POST",
        url: "/animes/create",
        handler: Create
    })
    fastify.route({
        method: "POST",
        url: "/animes/:id",
        handler: Update
    })
}
