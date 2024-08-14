import { FastifyReply, FastifyRequest } from 'fastify';
import mongoose from 'mongoose';
import { GroupeManager } from '@/_lib/groupe';
import { FilterRouter, GetRouter } from '@/_lib/interfaces';
import { Groupe_Pagination_ZOD } from '@/_validation/groupeZOD';

export const GetGroupeRouter = async (req: FastifyRequest<GetRouter>, res: FastifyReply) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const paramWithMedia = req.query.withMedia;
    const JSONWithMedia = JSON.parse(paramWithMedia || '{}');
    const groupe = await new GroupeManager(session).get(req.params.id, JSONWithMedia);

    await session.commitTransaction();
    await session.endSession();

    return groupe;
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    res.code(400).send();
  }
};

export const FilterGroupeRouter = async (req: FastifyRequest<FilterRouter>, res: FastifyReply) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const paramPagination = JSON.parse(req.query.pagination || '{}');
    const data = Groupe_Pagination_ZOD.parse(paramPagination);
    const groupe = await new GroupeManager(session).filter(data);

    await session.commitTransaction();
    await session.endSession();

    return groupe;
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    res.code(400).send();
  }
};
