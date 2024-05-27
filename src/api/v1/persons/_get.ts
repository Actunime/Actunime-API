

import { PersonModel } from "../../../_models/_personModel";
import { FastifyRequest } from "fastify";



export async function Get(req: FastifyRequest<{ Params: { id: string } }>) {
    const findPerson = await PersonModel.findOne({ id: req.params.id }).select('-_id');

    if (!findPerson) {
        return new Response("Person not found", { status: 404 });
    }

    return new Response(JSON.stringify(findPerson.toJSON()), { status: 200 });
}