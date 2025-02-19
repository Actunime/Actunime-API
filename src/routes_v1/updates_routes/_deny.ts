import { FastifyRequest } from "fastify";
import { IDenyChangesToPatch_ZOD, DenyChangesToPatch_ZOD } from "@actunime/validations";
import { APIError } from "../../_lib/Error";
import { PatchManager } from "../../_lib/patch";

export const DenyChangesRouter = async (
    req: FastifyRequest<{
        Body: IDenyChangesToPatch_ZOD;
    }>
) => {
    const data = DenyChangesToPatch_ZOD
        .parse(req.body);

    const user = req.currentUser;
    if (!user) throw new APIError("Vous n'êtes pas autorisé !", "UNAUTHORIZED");

    const initPatch = new PatchManager(req.session, { user });
    await initPatch.denyPatch(data);

    return {
        success: true
    };
};