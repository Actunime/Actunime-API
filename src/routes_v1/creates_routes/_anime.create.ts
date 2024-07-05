import { FastifyReply, FastifyRequest } from 'fastify';
import { Create_Anime_ZOD, ICreate_Anime_ZOD } from '@/_validation/animeZOD';
import mongoose from 'mongoose';
import { z } from 'zod';
import { AnimeManager } from '@/_lib/anime';

export const CreateAnimeRouter = async (
  req: FastifyRequest<{
    Body: {
      data: ICreate_Anime_ZOD;
      note: string;
    };
  }>,
  res: FastifyReply
) => {
  const session = await mongoose.startSession();

  try {
    const { data, note } = z
      .object({ note: z.string().optional(), data: Create_Anime_ZOD })
      .parse(req.body);

    session.startTransaction();
    const initAnime = await new AnimeManager(session, req.user).init(data);
    const anime = await initAnime.create(note);

    await session.commitTransaction();
    await session.endSession();
    return anime;
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    res.code(400).send();
  }
};

export const RequestCreateAnimeRouter = async (
  req: FastifyRequest<{
    Body: {
      data: ICreate_Anime_ZOD;
      note: string;
    };
  }>,
  res: FastifyReply
) => {
  const session = await mongoose.startSession();

  try {
    const { data, note } = z
      .object({ note: z.string().optional(), data: Create_Anime_ZOD })
      .parse(req.body);

    session.startTransaction();
    const initAnime = await new AnimeManager(session, req.user).init(data);
    const anime = await initAnime.createRequest(note);

    await session.commitTransaction();
    await session.endSession();
    return anime;
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    res.code(400).send();
  }
};
