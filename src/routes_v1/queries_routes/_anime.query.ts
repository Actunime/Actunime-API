import { FastifyReply, FastifyRequest } from 'fastify';
import mongoose from 'mongoose';
import { AnimeManager } from '@/_lib/anime';
import { FilterRouter, GetRouter } from '@/_lib/interfaces';
import { Anime_Pagination_ZOD } from '@/_validation/animeZOD';

export const GetAnimeRouter = async (req: FastifyRequest<GetRouter>, res: FastifyReply) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const paramWithMedia = req.query.withMedia;
    const JSONWithMedia = JSON.parse(paramWithMedia || '{}');
    const anime = await new AnimeManager(session).get(req.params.id, JSONWithMedia);

    await session.commitTransaction();
    await session.endSession();

    return anime;
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    res.code(400).send();
  }
};

export const FilterAnimeRouter = async (req: FastifyRequest<FilterRouter>, res: FastifyReply) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const paramPagination = JSON.parse(req.query.pagination || '{}');
    const data = Anime_Pagination_ZOD.parse(paramPagination);
    const anime = await new AnimeManager(session).filter(data);

    await session.commitTransaction();
    await session.endSession();

    return anime;
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    res.code(400).send();
  }
};
