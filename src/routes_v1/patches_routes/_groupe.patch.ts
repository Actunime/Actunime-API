import { FastifyRequest } from "fastify";
import { Create_Groupe_ZOD, ICreate_Groupe_ZOD } from "@actunime/validations";
import { z } from "zod";
import { GroupeManager } from "../../_lib/groupe";
import { APIError } from "../../_lib/Error";

export const PatchGroupeRouter = async (
  req: FastifyRequest<{
    Body: {
      data: ICreate_Groupe_ZOD;
      note: string;
    };
    Params: {
      id: string;
    };
  }>
) => {
  const { data, note } = z
    .object({
      note: z.string().optional(),
      data: Create_Groupe_ZOD.partial(),
    })
    .parse(req.body);

  const user = req.currentUser;
  if (!user) throw new APIError("Vous n'êtes pas autorisé !", "UNAUTHORIZED");

  const initGroupe = new GroupeManager(req.session, { user }).init(data);
  await initGroupe.patch(req.params.id, note);

  return {
    success: true,
  };
};

export const RequestPatchGroupeRouter = async (
  req: FastifyRequest<{
    Body: {
      data: ICreate_Groupe_ZOD;
      note: string;
    };
    Params: {
      id: string;
    };
  }>
) => {

  const { data, note } = z
    .object({
      note: z.string().optional(),
      data: Create_Groupe_ZOD.partial(),
    })
    .parse(req.body);

  const user = req.currentUser;
  if (!user) throw new APIError("Vous n'êtes pas autorisé !", "UNAUTHORIZED");

  const initGroupe = new GroupeManager(req.session, { user, isRequest: true }).init(data);
  await initGroupe.updateRequest(req.params.id, note);

  return {
    success: true,
  };
};
