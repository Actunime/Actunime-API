import { AccountModel, UserModel, AccessTokenModel } from "@actunime/mongoose-models";
import { userPermissionIsHigherThan } from "@actunime/types";
import { FastifyRequest } from "fastify";
import { APIError } from "../../../_lib/Error";
import { PatchManager } from "../../../_lib/patch";
import { z } from "zod";

export const DeleteAccount = async (req: FastifyRequest<{ Body: { id: string, deleteRelations: boolean, force: boolean, noTime: boolean } }>) => {
    const { data, error } = z.object({
        id: z.string(),
        deleteRelations: z.boolean(),
        force: z.boolean(),
        noTimeout: z.boolean()
    }).safeParse(req.body);

    if (error)
        throw new APIError(error.message, "BAD_REQUEST");

    const { id, deleteRelations, force, noTimeout } = data;


    const account = await AccountModel.findOne({ _id: id }).session(req.session);
    if (!account) throw new APIError("Le compte n'a pas été trouvé !", "NOT_FOUND");

    if (account.userId.includes("actunime"))
        throw new APIError("Ce compte n'est pas supprimable !", "FORBIDDEN");

    if (account.deletedAt && !force)
        throw new APIError("Le compte est déjà en cours de suppression !", "FORBIDDEN");

    const user = await UserModel.findOne({ id: account.userId }).session(req.session);
    if (!user && !force)
        throw new APIError("Aucun utilisateur lié a ce compte BIZZARE (utiliser la suppression forcé pour le supprimer) !", "NOT_FOUND");

    if (user && !deleteRelations && !force)
        throw new APIError("Attention un compte utilisateur est lié a ce compte ! (Utilisez la suppression forcée pour outre passer) !", "FORBIDDEN");

    const currentUser = req.currentUser;
    if (!currentUser) throw new APIError("Vous n'êtes pas autorisé !", "UNAUTHORIZED");

    if (account.userId === currentUser.id)
        throw new APIError("Vous ne pouvez pas supprimer votre compte !", "UNAUTHORIZED");

    if (user && userPermissionIsHigherThan(user.roles, currentUser.roles))
        throw new APIError("Vous ne pouvez pas supprimer cet utilisateur !", "FORBIDDEN");

    await AccessTokenModel.deleteMany({ userId: account.userId }).session(req.session);

    if (!noTimeout) {
        await AccountModel.findOneAndUpdate({ _id: account._id }, {
            deletedAt: new Date()
        }).session(req.session);
    } else if (userPermissionIsHigherThan(currentUser.roles, "ACTUNIME")) {
        await AccountModel.deleteOne({ _id: account._id }).session(req.session);
    } else {
        throw new APIError("Vous n'avez pas les permissions pour supprimer ce compte instantanément !", "FORBIDDEN");
    }

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
        type: noTimeout ? "DELETE_FORCE" : "DELETE",
        note: noTimeout ? "Suppression du compte (pas de restoration possible)" : "Suppression du compte (restauration possible sur 24h)",
        status: "ACCEPTED"
    }, req.session)

    if (deleteRelations) {

        if (!noTimeout) {
            await UserModel.findOneAndUpdate({ id: account.userId }, {
                deletedAt: new Date()
            }).session(req.session);
        } else if (userPermissionIsHigherThan(currentUser.roles, "ACTUNIME")) {
            await UserModel.deleteOne({ id: account.userId }).session(req.session);
        } else {
            throw new APIError("Vous n'avez pas les permissions pour supprimer cet utilisateur instantanamment !", "FORBIDDEN");
        }

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
            type: noTimeout ? "DELETE_FORCE" : "DELETE",
            note: noTimeout ? "Suppression de l'utilisateur (pas de restauration possible)" : "Suppression de l'utilisateur (restauration possible sur 24h)",
            status: "ACCEPTED"
        }, req.session)
    }

    return {
        success: true
    }
}