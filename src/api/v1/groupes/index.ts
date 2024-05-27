import { FastifyInstance } from "fastify";
import { Filter } from './_filter';
import { Get } from "./_get";
// import { Create } from "./_create";
// import { Update } from "./_update";



export async function Groupes_V1(fastify: FastifyInstance) {
    fastify.route({
        method: "GET",
        url: "/groupes",
        handler: Filter
    })
    fastify.route({
        method: "GET",
        url: "/groupes/:id",
        handler: Get
    })
    // fastify.route({
    //     method: "POST",
    //     url: "/groupes/create",
    //     handler: Create
    // })
    // fastify.route({
    //     method: "POST",
    //     url: "/groupes/:id",
    //     handler: Update
    // })
}
