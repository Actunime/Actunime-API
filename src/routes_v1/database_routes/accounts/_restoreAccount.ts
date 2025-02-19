import { AccountModel, UserModel } from "@actunime/mongoose-models";
import { FastifyRequest } from "fastify";
import { z } from "zod";
import { APIError } from "../../../_lib/Error";
import { PatchManager } from "../../../_lib/patch";


export const RestoreAccount = async (req: FastifyRequest<{ Body: { id: string, restoreRelations: boolean } }>) => {
    const { data, error } = z
        .object({
            id: z.string(),
            restoreRelations: z.boolean().optional(),
        })
        .safeParse(req.body);

    if (error)
        throw new APIError(error.message, "BAD_REQUEST");

    const { id, restoreRelations } = data;

    const currentUser = req.currentUser;
    if (!currentUser) throw new APIError("Vous n'êtes pas autorisé !", "UNAUTHORIZED");

    const account = await AccountModel.findOne({ id }).session(req.session);
    if (!account)
        throw new APIError("Le compte n'a pas été trouvé !", "NOT_FOUND");

    if (currentUser.id === account.userId)
        throw new APIError("Vous ne pouvez pas restorer votre compte !", "UNAUTHORIZED");

    await AccountModel.findOneAndUpdate({ _id: account._id }, { deletedAt: undefined }).session(req.session);
    await PatchManager.PatchCreate({
        author: {
            id: currentUser.id,
        },
        currentModerator: {
            id: currentUser.id,
            at: new Date()
        },
        target: {
            id: account.id
        },
        targetPath: "Account",
        type: "DELETE_RESTORE",
        note: "Restauration de compte",
        status: "ACCEPTED"
    }, req.session)

    if (restoreRelations) {
        await UserModel.findOneAndUpdate({ userId: account.userId }, { deletedAt: undefined }).session(req.session);
        await PatchManager.PatchCreate({
            author: {
                id: currentUser.id,
            },
            currentModerator: {
                id: currentUser.id,
                at: new Date()
            },
            target: {
                id: account.userId
            },
            targetPath: "User",
            type: "DELETE_RESTORE",
            note: "Restauration de l'utilisateur suite à la restoration du compte",
            status: "ACCEPTED"
        }, req.session)
    }

}