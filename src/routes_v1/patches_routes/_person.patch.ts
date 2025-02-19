import { FastifyRequest } from "fastify";
import { Create_Person_ZOD, ICreate_Person_ZOD, Partial_Create_Person_ZOD } from "@actunime/validations";
import { z } from "zod";
import { PersonManager } from "../../_lib/person";
import { APIError } from "../../_lib/Error";

export const PatchPersonRouter = async (
  req: FastifyRequest<{
    Body: {
      data: ICreate_Person_ZOD;
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
      data: Partial_Create_Person_ZOD,
    })
    .parse(req.body);

  const user = req.currentUser;
  if (!user) throw new APIError("Vous n'êtes pas autorisé !", "UNAUTHORIZED");

  const initPerson = await new PersonManager(req.session, { user }).init(data);
  await initPerson.patch(req.params.id, note);

  return {
    success: true,
  };
};

export const RequestPatchPersonRouter = async (
  req: FastifyRequest<{
    Body: {
      data: ICreate_Person_ZOD;
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
      data: Partial_Create_Person_ZOD,
    })
    .parse(req.body);

  const user = req.currentUser;
  if (!user) throw new APIError("Vous n'êtes pas autorisé !", "UNAUTHORIZED");

  const initPerson = await new PersonManager(req.session, { user, isRequest: true }).init(data);
  await initPerson.updateRequest(req.params.id, note);

  return {
    success: true,
  };
};
