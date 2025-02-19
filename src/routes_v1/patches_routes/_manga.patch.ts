import { FastifyRequest } from "fastify";
import { Create_Manga_ZOD, ICreate_Manga_ZOD } from "@actunime/validations";
import { z } from "zod";
import { MangaManager } from "../../_lib/manga";
import { APIError } from "../../_lib/Error";

export const PatchMangaRouter = async (
  req: FastifyRequest<{
    Body: {
      data: ICreate_Manga_ZOD;
      note: string;
    };
    Params: {
      id: string;
    };
  }>
) => {
  const { data, note } = z
    .object({ note: z.string().optional(), data: Create_Manga_ZOD })
    .parse(req.body);

  const user = req.currentUser;
  if (!user) throw new APIError("Vous n'êtes pas autorisé !", "UNAUTHORIZED");

  const initManga = await new MangaManager(req.session, { user }).init(data);
  await initManga.patch(req.params.id, note);

  return {
    success: true,
  };
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
  }>
) => {

  const { data, note } = z
    .object({ note: z.string().optional(), data: Create_Manga_ZOD })
    .parse(req.body);

  const user = req.currentUser;
  if (!user) throw new APIError("Vous n'êtes pas autorisé !", "UNAUTHORIZED");

  const initManga = await new MangaManager(req.session, { user }).init(data);
  await initManga.updateRequest(req.params.id, note);

  return {
    success: true,
  };
};
