import { FastifyReply, FastifyRequest } from 'fastify';
import mongoose from 'mongoose';
import { MangaManager } from '@/_lib/manga';
import { FilterRouter, GetRouter } from '@/_lib/interfaces';
import { Manga_Pagination_ZOD } from '@/_validation/mangaZOD';

export const GetMangaRouter = async (req: FastifyRequest<GetRouter>, res: FastifyReply) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const paramWithMedia = req.query.withMedia;
    const JSONWithMedia = JSON.parse(paramWithMedia || 'object');
    const manga = await new MangaManager(session).get(req.params.id, JSONWithMedia);

    await session.commitTransaction();
    await session.endSession();

    return manga;
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    res.code(400).send();
  }
};

export const FilterMangaRouter = async (req: FastifyRequest<FilterRouter>, res: FastifyReply) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const paramPagination = JSON.parse(req.query.pagination || '{}');
    const data = Manga_Pagination_ZOD.parse(paramPagination);
    const manga = await new MangaManager(session).filter(data);

    await session.commitTransaction();
    await session.endSession();

    return manga;
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    res.code(400).send();
  }
};
