import { UserModel } from "@actunime/mongoose-models";
import { FastifyRequest } from "fastify";
import { z } from "zod";
import { APIError } from "../../../_lib/Error";
import { PatchManager } from "../../../_lib/patch";

export const RestoreUser = async (request: FastifyRequest<{ Body: { id: string } }>) => {
    const { data, error } = z
        .object({
            id: z.string()
        })
        .safeParse(request.body);

    if (error)
        throw new APIError(error.message, "BAD_REQUEST");

    const { id } = data;

    const currentUser = request.currentUser;
    if (!currentUser) throw new APIError("Vous n'êtes pas autorisé !", "UNAUTHORIZED");

    const user = await UserModel.findOne({ id }).session(request.session);
    if (!user)
        throw new APIError("L'utilisateur n'a pas été trouvé !", "NOT_FOUND");

    if (!user.deletedAt)
        throw new APIError("L'utilisateur n'est pas sur le point d'être supprimé !", "NOT_FOUND");

    if (currentUser.id === user.id)
        throw new APIError("Vous ne pouvez pas restorer votre propre utilisateur !", "UNAUTHORIZED");

    await UserModel.findOneAndUpdate({ _id: user._id }, { deletedAt: undefined }).session(request.session);
    await PatchManager.PatchCreate({
        author: {
            id: currentUser.id,
        },
        currentModerator: {
            id: currentUser.id,
            at: new Date()
        },
        target: {
            id: user.id
        },
        targetPath: "User",
        type: "DELETE_RESTORE",
        note: "Restauration d'utilisateur",
        status: "ACCEPTED"
    }, request.session);

}