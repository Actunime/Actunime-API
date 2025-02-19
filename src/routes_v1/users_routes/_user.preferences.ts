import { FastifyRequest } from "fastify";
import { IPatch_UserPreferences_ZOD, Patch_UserPreferences_ZOD } from "@actunime/validations";
import { z } from "zod";
import { UserManager } from "../../_lib/user";
import { APIError } from "../../_lib/Error";

export const PatchUserPreferencesRouter = async (
    req: FastifyRequest<{
        Body: {
            data: IPatch_UserPreferences_ZOD;
            note: string;
        };
    }>
) => {
    const { data, note } = z
        .object({ note: z.string().optional(), data: Patch_UserPreferences_ZOD.partial() })
        .parse(req.body);

    const user = req.currentUser;
    if (!user) throw new APIError("Vous n'êtes pas autorisé !", "UNAUTHORIZED");

    const initUser = new UserManager(req.session, { user, isRequest: true });
    const newUser = await initUser.patchPreferences(data, note);

    return newUser;
};
