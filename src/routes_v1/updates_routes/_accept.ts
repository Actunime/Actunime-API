import { FastifyRequest } from "fastify";
import { AcceptChangesToPatch_ZOD, IAcceptChangesToPatch_ZOD } from "@actunime/validations";
import { APIError } from "../../_lib/Error";
import { PatchManager } from "../../_lib/patch";

export const AcceptChangesRouter = async (
    req: FastifyRequest<{
        Body: IAcceptChangesToPatch_ZOD;
    }>
) => {
    const data = AcceptChangesToPatch_ZOD
        .parse(req.body);

    const user = req.currentUser;
    if (!user) throw new APIError("Vous n'êtes pas autorisé !", "UNAUTHORIZED");

    const initPatch = new PatchManager(req.session, { user });
    await initPatch.acceptPatch(data);

    return {
        success: true
    };
};