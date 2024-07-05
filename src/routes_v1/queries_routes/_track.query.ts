import { FastifyReply, FastifyRequest } from 'fastify';
import mongoose from 'mongoose';
import { TrackManager } from '@/_lib/track';
import { FilterRouter, GetRouter } from '@/_lib/interfaces';
import { Track_Pagination_ZOD } from '@/_validation/trackZOD';

export const GetTrackRouter = async (req: FastifyRequest<GetRouter>, res: FastifyReply) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const paramWithMedia = req.query.withMedia;
    const JSONWithMedia = JSON.parse(paramWithMedia || 'object');
    const track = await new TrackManager(session).get(req.params.id, JSONWithMedia);

    await session.commitTransaction();
    await session.endSession();

    return track;
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    res.code(400).send();
  }
};

export const FilterTrackRouter = async (req: FastifyRequest<FilterRouter>, res: FastifyReply) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const paramPagination = JSON.parse(req.query.pagination || '{}');
    const data = Track_Pagination_ZOD.parse(paramPagination);
    const track = await new TrackManager(session).filter(data);

    await session.commitTransaction();
    await session.endSession();

    return track;
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    res.code(400).send();
  }
};
