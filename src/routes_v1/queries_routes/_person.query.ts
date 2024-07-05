import { FastifyReply, FastifyRequest } from 'fastify';
import mongoose from 'mongoose';
import { PersonManager } from '@/_lib/person';
import { FilterRouter, GetRouter } from '@/_lib/interfaces';
import { Person_Pagination_ZOD } from '@/_validation/personZOD';

export const GetPersonRouter = async (req: FastifyRequest<GetRouter>, res: FastifyReply) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const paramWithMedia = req.query.withMedia;
    const JSONWithMedia = JSON.parse(paramWithMedia || 'object');
    const person = await new PersonManager(session).get(req.params.id, JSONWithMedia);

    await session.commitTransaction();
    await session.endSession();

    return person;
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    res.code(400).send();
  }
};

export const FilterPersonRouter = async (req: FastifyRequest<FilterRouter>, res: FastifyReply) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const paramPagination = JSON.parse(req.query.pagination || '{}');
    const data = Person_Pagination_ZOD.parse(paramPagination);
    const person = await new PersonManager(session).filter(data);

    await session.commitTransaction();
    await session.endSession();

    return person;
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    res.code(400).send();
  }
};
