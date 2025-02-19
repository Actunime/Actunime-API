import { FastifyRequest } from "fastify";
import { IDeletePatch_ZOD, DeletePatch_ZOD } from "@actunime/validations";
import { APIError } from "../../_lib/Error";
import { PatchManager } from "../../_lib/patch";

export const DeleteChangesRouter = async (
    req: FastifyRequest<{
        Body: IDeletePatch_ZOD;
    }>
) => {
    const data = DeletePatch_ZOD
        .parse(req.body);

    const user = req.currentUser;
    if (!user) throw new APIError("Vous n'êtes pas autorisé !", "UNAUTHORIZED");

    const initPatch = new PatchManager(req.session, { user });
    await initPatch.deletePatch(data);

    return {
        success: true
    };
};