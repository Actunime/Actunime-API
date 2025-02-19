import { FastifyRequest } from "fastify";
import { IAddChangesToPatch_ZOD, AddChangesToPatch_ZOD } from "@actunime/validations";
import { APIError } from "../../_lib/Error";
import { PatchManager } from "../../_lib/patch";

export const UpdateChangesRouter = async (
  req: FastifyRequest<{
    Body: IAddChangesToPatch_ZOD;
  }>
) => {
  const data = AddChangesToPatch_ZOD.parse(req.body);

  const user = req.currentUser;
  if (!user) throw new APIError("Vous n'êtes pas autorisé !", "UNAUTHORIZED");

  const initPatch = new PatchManager(req.session, { user });
  await initPatch.patch(data);

  return {
    success: true
  };
};