import { FastifyInstance } from "fastify";
import { Filter } from './_filter';
import { Get } from "./_get";
import { Create } from "./_create";
import { Update } from "./_update";



export async function Mangas_V1(fastify: FastifyInstance) {
    fastify.route({
        method: "GET",
        url: "/mangas",
        handler: Filter
    })
    fastify.route({
        method: "GET",
        url: "/mangas/:id",
        handler: Get
    })
    fastify.route({
        method: "POST",
        url: "/mangas/create",
        handler: Create
    })
    fastify.route({
        method: "POST",
        url: "/mangas/:id",
        handler: Update
    })
}
