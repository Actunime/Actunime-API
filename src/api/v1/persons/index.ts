import { FastifyInstance } from "fastify";
import { Filter } from './_filter';
import { Get } from "./_get";
// import { Create } from "./_create";
import { Update } from "./_update";



export async function Persons_V1(fastify: FastifyInstance) {
    fastify.route({
        method: "GET",
        url: "/persons",
        handler: Filter
    })
    fastify.route({
        method: "GET",
        url: "/persons/:id",
        handler: Get
    })
    // fastify.route({
    //     method: "POST",
    //     url: "/persons/create",
    //     handler: Create
    // })
    fastify.route({
        method: "POST",
        url: "/persons/:id",
        handler: Update
    })
}
