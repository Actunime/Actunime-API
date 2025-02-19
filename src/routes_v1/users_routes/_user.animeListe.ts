import { FastifyRequest } from "fastify";
import { IPatch_UserPreferences_ZOD, IUserAnimeListe_ZOD, Patch_UserPreferences_ZOD, UserAnimeListe_ZOD } from "@actunime/validations";
import { z } from "zod";
import { UserManager } from "../../_lib/user";
import { APIError } from "../../_lib/Error";
import { IUserAnimeListe } from "@actunime/types";

export const PatchUserAnimeToListeRouter = async (
    req: FastifyRequest<{
        Body: IUserAnimeListe_ZOD;
    }>
) => {
    const data = UserAnimeListe_ZOD.parse(req.body);

    const user = req.currentUser;
    if (!user) throw new APIError("Vous n'êtes pas autorisé !", "UNAUTHORIZED");

    const initUser = new UserManager(req.session, { user });
    const newUser = await initUser.updateAnimeToListe(data);

    return newUser;
};


export const DeleteUserAnimeToListeRouter = async (
    req: FastifyRequest<{
        Body: {
            id: string;
        };
    }>
) => {
    const data = z.object({ id: z.string() }).parse(req.body);

    const user = req.currentUser;
    if (!user) throw new APIError("Vous n'êtes pas autorisé !", "UNAUTHORIZED");

    const initUser = new UserManager(req.session, { user });
    const newUser = await initUser.deleteAnimeToListe(data.id);

    return newUser;
};
