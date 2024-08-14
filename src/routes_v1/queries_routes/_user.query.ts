import { FastifyReply, FastifyRequest } from 'fastify';
import mongoose from 'mongoose';
import { UserManager } from '@/_lib/user';
import { FilterRouter, GetRouter } from '@/_lib/interfaces';
import { User_Pagination_ZOD } from '@/_validation/userZOD';

export const GetUserRouter = async (req: FastifyRequest<GetRouter>, res: FastifyReply) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const paramWithMedia = req.query.withMedia;
    const JSONWithMedia = JSON.parse(paramWithMedia || '{}');
    const user = await new UserManager(session).get(req.params.id, JSONWithMedia);

    await session.commitTransaction();
    await session.endSession();

    return user;
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    res.code(400).send();
  }
};

export const FilterUserRouter = async (req: FastifyRequest<FilterRouter>, res: FastifyReply) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const paramPagination = JSON.parse(req.query.pagination || '{}');
    const data = User_Pagination_ZOD.parse(paramPagination);
    const user = await new UserManager(session).filter(data);

    await session.commitTransaction();
    await session.endSession();

    return user;
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    res.code(400).send();
  }
};
