import { UserModel, AccountModel } from "@actunime/mongoose-models";
import { FastifyRequest } from "fastify";
import { z } from "zod";
import { APIError } from "../../../_lib/Error";
import { PatchManager } from "../../../_lib/patch";


export const SetUserToAccount = async (request: FastifyRequest<{ Body: { userId: string, accountId: string, force: boolean } }>) => {
    const { data, error } = z.object({
        userId: z.string(),
        accountId: z.string(),
        force: z.boolean().optional(),
        deleteCurrentAccountAssignedUser: z.boolean().optional()
    }).safeParse(request.body);

    if (error)
        throw new APIError(error.message, "BAD_REQUEST");

    const { userId, accountId, force, deleteCurrentAccountAssignedUser } = data;

    const user = await UserModel.findOne({ $or: [{ id: userId }, { _id: userId }] }).session(request.session);
    if (!user) throw new APIError("Utilisateur non trouvé", "NOT_FOUND");

    const currentUser = request.currentUser;
    if (!currentUser) throw new APIError("Vous n'êtes pas autorisé !", "UNAUTHORIZED");

    if (user.id === currentUser.id)
        throw new APIError("Vous ne pouvez pas modifier votre compte !", "UNAUTHORIZED");

    const userHasAnAccount = await AccountModel.findOne({ userId: user.id }).session(request.session);

    if (userHasAnAccount && !force)
        throw new APIError("L'utilisateur a d'autres comptes (utilisé force pour passer outre) !", "FORBIDDEN");

    const accountToLink = await AccountModel.findOne({ $or: [{ id: accountId }, { _id: accountId }] }).session(request.session);
    if (!accountToLink)
        throw new APIError("Compte a lié non trouvé", "NOT_FOUND");

    // Supprimer l'utilisateur lié précédement au compte;
    if (deleteCurrentAccountAssignedUser) {
        await UserModel.updateOne({ userId: accountToLink.userId }, { deletedAt: new Date() }).session(request.session);
        await PatchManager.PatchCreate({
            author: {
                id: currentUser.id,
            },
            currentModerator: {
                id: currentUser.id,
                at: new Date()
            },
            target: {
                id: accountToLink.userId
            },
            targetPath: "User",
            type: "DELETE",
            note: "Le compte de cet utilisateur a été assigné a un autre utilisateur, cet utilisateur sera supprimé dans 24h automatiquement",
            status: "ACCEPTED"
        }, request.session)
    }

    const updatedAccount = await AccountModel.findOneAndUpdate(
        { userId: user.id }, {
        $set: {
            user: user._id,
            userId: user.id
        },
    }).session(request.session);

    await PatchManager.PatchCreate({
        author: {
            id: currentUser.id,
        },
        currentModerator: {
            id: currentUser.id,
            at: new Date()
        },
        target: {
            id: updatedAccount?.id
        },
        oldValues: {
            user: accountToLink.user,
            userId: accountToLink.userId,
        },
        newValues: {
            user: user._id,
            userId: user.id
        },
        targetPath: "Account",
        type: "PATCH",
        note: "Le compte a été lié a un nouvel utilisateur",
        status: "ACCEPTED"
    }, request.session)

    const newUser = await UserModel.findById(user._id).select("_id").session(request.session);
    return newUser?.toJSON();
}