import { UserModel, AccessTokenModel, AccountModel } from "@actunime/mongoose-models";
import { userPermissionIsHigherThan } from "@actunime/types";
import { FastifyRequest } from "fastify";
import { APIError } from "../../../_lib/Error";
import { PatchManager } from "../../../_lib/patch";
import { z } from "zod";
import mongoose from "mongoose";

export const DeleteUser = async (request: FastifyRequest<{
    Body: {
        id: string,
        deleteRelations: boolean,
        noTimeout: boolean
    }
}>) => {
    const { data, error } = z.object({
        id: z.string(),
        deleteRelations: z.boolean(),
        noTimeout: z.boolean().optional()
    }).safeParse(request.body);

    if (error)
        throw new APIError(error.message, "BAD_REQUEST");

    const session = request.session;

    const { id, deleteRelations, noTimeout } = data;

    const idObjectId = (id as any) instanceof mongoose.Types.ObjectId ? id : new mongoose.Types.ObjectId(id);

    const user = await UserModel.findOne({ _id: idObjectId }, null, { session });
    if (!user) throw new APIError("Le compte n'a pas été trouvé !", "NOT_FOUND");

    if (user.roles.includes("ACTUNIME"))
        throw new APIError("Cet utilisateur n'est pas supprimable !", "FORBIDDEN");

    const currentUser = request.currentUser;
    if (!currentUser) throw new APIError("Vous n'êtes pas autorisé !", "UNAUTHORIZED");

    if (user.id === currentUser.id)
        throw new APIError("Vous ne pouvez pas supprimer votre propre utilisateur !", "UNAUTHORIZED");

    if (user && userPermissionIsHigherThan(user.roles, currentUser.roles))
        throw new APIError("Vous ne pouvez pas supprimer cet utilisateur !", "FORBIDDEN");

    if (noTimeout) {
        if (userPermissionIsHigherThan(currentUser.roles, "ACTUNIME")) {
            await UserModel.deleteOne({ id: user.id });
        } else {
            throw new APIError("Vous n'avez pas les permissions pour supprimé cet utilisateur de façon instantané !", "UNAUTHORIZED");
        }
    } else {
        await UserModel.findOneAndUpdate({ _id: user._id }, {
            deletedAt: new Date()
        }, { session });
    }


    if (deleteRelations) {
        if (noTimeout && userPermissionIsHigherThan(currentUser.roles, "ACTUNIME"))
            await AccountModel.deleteOne({ userId: user.id }, { session });
        else
            await AccountModel.findOneAndUpdate({ userId: user.id }, { deletedAt: new Date() }, { session });

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
            type: noTimeout ? "DELETE" : "DELETE_FORCE",
            note: `Suppression de l'utilisateur (${noTimeout ? "restauration possible sur 24h" : "restauration impossible"})`,
            status: "ACCEPTED"
        }, session)
    }

    // UTILISER SESSSION MONGOOSE POUR GESTION ERREUR DE SAUVEGARDE !:

    await AccessTokenModel.deleteOne({ userId: user.id }, { session });

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
        type: noTimeout ? "DELETE_FORCE" : "DELETE",
        note: `Suppression du compte (${noTimeout ? "restauration possible sur 24h" : "restauration impossible"})`,
        status: "ACCEPTED"
    }, session);

    return {
        success: true
    }
}