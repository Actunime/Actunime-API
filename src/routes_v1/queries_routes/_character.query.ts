import { FastifyReply, FastifyRequest } from 'fastify';
import mongoose from 'mongoose';
import { CharacterManager } from '@/_lib/character';
import { FilterRouter, GetRouter } from '@/_lib/interfaces';
import { Character_Pagination_ZOD } from '@/_validation/characterZOD';

export const GetCharacterRouter = async (req: FastifyRequest<GetRouter>, res: FastifyReply) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const paramWithMedia = req.query.withMedia;
    const JSONWithMedia = JSON.parse(paramWithMedia || '{}');
    const character = await new CharacterManager(session).get(req.params.id, JSONWithMedia);

    await session.commitTransaction();
    await session.endSession();

    return character;
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    res.code(400).send();
  }
};

export const FilterCharacterRouter = async (
  req: FastifyRequest<FilterRouter>,
  res: FastifyReply
) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const paramPagination = JSON.parse(req.query.pagination || '{}');
    const data = Character_Pagination_ZOD.parse(paramPagination);
    const character = await new CharacterManager(session).filter(data);

    await session.commitTransaction();
    await session.endSession();

    return character;
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    res.code(400).send();
  }
};
