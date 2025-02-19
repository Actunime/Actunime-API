import { AccountModel } from "@actunime/mongoose-models";
import { FastifyRequest } from "fastify";
import { APIError } from "../../../_lib/Error";


export const GetAccount = async (request: FastifyRequest<{ Params: { id: string } }>) => {
    const account = await AccountModel
        .findOne({ $or: [{ id: request.params.id }, { _id: request.params.id }] })
        .select("-email").session(request.session);
    if (!account) throw new APIError("Le compte n'a pas été trouvé !", "NOT_FOUND");
    return account.toJSON();
}