import { UserModel } from "@actunime/mongoose-models";
import { FastifyRequest } from "fastify";
import { APIError } from "../../../_lib/Error";


export const GetUser = async (request: FastifyRequest<{ Params: { id: string } }>) => {
    const user = await UserModel
        .findOne({ $or: [{ id: request.params.id }, { _id: request.params.id }] })
        .session(request.session)
        .select("-email");
    if (!user) throw new APIError("L'utilisateur n'a pas été trouvé !", "NOT_FOUND");
    return user.toJSON();
}