import { FastifyReply, FastifyRequest } from 'fastify';
import mongoose from 'mongoose';
import { ActivityManager } from '@/_lib/activity';
import { FilterRouter, GetRouter } from '@/_lib/interfaces';
import { Activity_Pagination_ZOD } from '@/_validation/activityZOD';

export const GetActivityRouter = async (req: FastifyRequest<GetRouter>, res: FastifyReply) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const paramWithMedia = req.query.withMedia;
    const JSONWithMedia = JSON.parse(paramWithMedia || 'object');
    const activity = await new ActivityManager(session, req.user).get(req.params.id, JSONWithMedia);

    await session.commitTransaction();
    await session.endSession();

    return activity;
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    res.code(400).send();
  }
};

export const FilterActivityRouter = async (
  req: FastifyRequest<FilterRouter>,
  res: FastifyReply
) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const paramPagination = JSON.parse(req.query.pagination || '{}');
    const data = Activity_Pagination_ZOD.parse(paramPagination);
    const activity = await new ActivityManager(session, req.user).filter(data);

    await session.commitTransaction();
    await session.endSession();

    return activity;
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    res.code(400).send();
  }
};
