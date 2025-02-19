import { FastifyRequest } from "fastify";
import { Create_Groupe_ZOD, ICreate_Groupe_ZOD } from "@actunime/validations";
import { z } from "zod";
import { GroupeManager } from "../../_lib/groupe";
import { APIError } from "../../_lib/Error";

export const CreateGroupeRouter = async (
  req: FastifyRequest<{
    Body: {
      data: ICreate_Groupe_ZOD;
      note: string;
    };
  }>
) => {
  const { data, note } = z
    .object({ note: z.string().optional(), data: Create_Groupe_ZOD })
    .parse(req.body);

  const user = req.currentUser;
  if (!user) throw new APIError("Vous n'êtes pas autorisé !", "UNAUTHORIZED");
  const initGroupe = new GroupeManager(req.session, { user }).init(data);
  await initGroupe.create(note);

  return {
    success: true,
  };
};

export const RequestCreateGroupeRouter = async (
  req: FastifyRequest<{
    Body: {
      data: ICreate_Groupe_ZOD;
      note: string;
    };
  }>
) => {
  const { data, note } = z
    .object({ note: z.string().optional(), data: Create_Groupe_ZOD })
    .parse(req.body);

  const user = req.currentUser;
  if (!user) throw new APIError("Vous n'êtes pas autorisé !", "UNAUTHORIZED");

  const initGroupe = new GroupeManager(req.session, { user, isRequest: true }).init(data);
  await initGroupe.createRequest(note);

  return {
    success: true,
  };
};
