import { FastifyReply, FastifyRequest } from 'fastify';
import { Create_Manga_ZOD, ICreate_Manga_ZOD } from '@/_validation/mangaZOD';
import mongoose from 'mongoose';
import { z } from 'zod';
import { MangaManager } from '@/_lib/manga';

export const PatchMangaRouter = async (
  req: FastifyRequest<{
    Body: {
      data: ICreate_Manga_ZOD;
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
      .object({ note: z.string().optional(), data: Create_Manga_ZOD })
      .parse(req.body);

    session.startTransaction();
    const initManga = await new MangaManager(session, req.user).init(data);
    const manga = await initManga.update(req.params.id, note);

    await session.commitTransaction();
    await session.endSession();
    return manga;
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    res.code(400).send();
  }
};

export const RequestPatchMangaRouter = async (
  req: FastifyRequest<{
    Body: {
      data: ICreate_Manga_ZOD;
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
      .object({ note: z.string().optional(), data: Create_Manga_ZOD })
      .parse(req.body);

    session.startTransaction();
    const initManga = await new MangaManager(session, req.user).init(data);
    const manga = await initManga.updateRequest(req.params.id, note);

    await session.commitTransaction();
    await session.endSession();
    return manga;
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    res.code(400).send();
  }
};
