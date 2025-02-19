import { FastifyRequest } from "fastify";
import {
  Create_Character_ZOD,
  ICreate_Character_ZOD,
} from "@actunime/validations";
import { z } from "zod";
import { CharacterManager } from "../../_lib/character";
import { APIError } from "../../_lib/Error";
export const PatchCharacterRouter = async (
  req: FastifyRequest<{
    Body: {
      data: ICreate_Character_ZOD;
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
      data: Create_Character_ZOD.partial(),
    })
    .parse(req.body);


  const user = req.currentUser;
  if (!user) throw new APIError("Vous n'êtes pas autorisé !", "UNAUTHORIZED");

  const initCharacter = await new CharacterManager(req.session, { user }).init(
    data,
  );
  await initCharacter.patch(req.params.id, note);

  return {
    success: true,
  };
};

export const RequestPatchCharacterRouter = async (
  req: FastifyRequest<{
    Body: {
      data: ICreate_Character_ZOD;
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
      data: Create_Character_ZOD.partial(),
    })
    .parse(req.body);


  const user = req.currentUser;
  if (!user) throw new APIError("Vous n'êtes pas autorisé !", "UNAUTHORIZED");

  const initCharacter = await new CharacterManager(req.session, { user, isRequest: true }).init(
    data,
  );

  await initCharacter.updateRequest(req.params.id, note);

  return {
    success: true,
  };
};
