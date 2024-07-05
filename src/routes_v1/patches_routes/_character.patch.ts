import { FastifyReply, FastifyRequest } from 'fastify';
import { Create_Character_ZOD, ICreate_Character_ZOD } from '@/_validation/characterZOD';
import mongoose from 'mongoose';
import { z } from 'zod';
import { CharacterManager } from '@/_lib/character';

export const PatchCharacterRouter = async (
  req: FastifyRequest<{
    Body: {
      data: ICreate_Character_ZOD;
      note: string;
    };
    Params: {
      id: string;
    };
  }>,
  res: FastifyReply
) => {
  const session = await mongoose.startSession();

  try {
    const { data, note } = z
      .object({ note: z.string().optional(), data: Create_Character_ZOD.partial() })
      .parse(req.body);

    session.startTransaction();
    const initCharacter = await new CharacterManager(session, req.user).init(data);
    const character = await initCharacter.update(req.params.id, note);

    await session.commitTransaction();
    await session.endSession();
    return character;
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    res.code(400).send();
  }
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
  }>,
  res: FastifyReply
) => {
  const session = await mongoose.startSession();

  try {
    const { data, note } = z
      .object({ note: z.string().optional(), data: Create_Character_ZOD.partial() })
      .parse(req.body);

    session.startTransaction();
    const initCharacter = await new CharacterManager(session, req.user).init(data);
    const character = await initCharacter.updateRequest(req.params.id, note);

    await session.commitTransaction();
    await session.endSession();
    return character;
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    res.code(400).send();
  }
};
