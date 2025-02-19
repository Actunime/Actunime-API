import { FastifyRequest } from "fastify";
import { Create_Manga_ZOD, ICreate_Manga_ZOD } from "@actunime/validations";
import { z } from "zod";
import { MangaManager } from "../../_lib/manga";
import { APIError } from "../../_lib/Error";

export const CreateMangaRouter = async (
  req: FastifyRequest<{
    Body: {
      data: ICreate_Manga_ZOD;
      note: string;
    };
  }>,
) => {

  const { data, note } = z
    .object({ note: z.string().optional(), data: Create_Manga_ZOD })
    .parse(req.body);

  const user = req.currentUser;
  if (!user) throw new APIError("Vous n'êtes pas autorisé !", "UNAUTHORIZED");

  const initManga = await new MangaManager(req.session, { user }).init(data);
  await initManga.create(note);

  return {
    success: true,
  };
};

export const RequestCreateMangaRouter = async (
  req: FastifyRequest<{
    Body: {
      data: ICreate_Manga_ZOD;
      note: string;
    };
  }>
) => {

  const { data, note } = z
    .object({ note: z.string().optional(), data: Create_Manga_ZOD })
    .parse(req.body);

  const user = req.currentUser;
  if (!user) throw new APIError("Vous n'êtes pas autorisé !", "UNAUTHORIZED");

  const initManga = await new MangaManager(req.session, { user, isRequest: true }).init(data);
  await initManga.createRequest(note);
  return {
    success: true,
  };
};
