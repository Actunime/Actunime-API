import { FastifyRequest } from "fastify";
import {
  Create_Character_ZOD,
  ICreate_Character_ZOD,
} from "@actunime/validations";
import { z } from "zod";
import { CharacterManager } from "../../_lib/character";
import { APIError } from "../../_lib/Error";

export const CreateCharacterRouter = async (
  req: FastifyRequest<{
    Body: {
      data: ICreate_Character_ZOD;
      note: string;
    };
  }>
) => {
  const { data, note } = z
    .object({ note: z.string().optional(), data: Create_Character_ZOD })
    .parse(req.body);

  const user = req.currentUser;
  if (!user) throw new APIError("Vous n'êtes pas autorisé !", "UNAUTHORIZED");

  const initCharacter = await new CharacterManager(req.session, { user }).init(
    data,
  );
  await initCharacter.create(note);

  return {
    success: true,
  };
};

export const RequestCreateCharacterRouter = async (
  req: FastifyRequest<{
    Body: {
      data: ICreate_Character_ZOD;
      note: string;
    };
  }>,
) => {

  const { data, note } = z
    .object({ note: z.string().optional(), data: Create_Character_ZOD })
    .parse(req.body);

  const user = req.currentUser;
  if (!user) throw new APIError("Vous n'êtes pas autorisé !", "UNAUTHORIZED");

  const initCharacter = await new CharacterManager(req.session, { user, isRequest: true }).init(
    data,
  );
  await initCharacter.createRequest(note);

  return {
    success: true,
  };
};
