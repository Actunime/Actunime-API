import { FastifyRequest } from "fastify";
import { Create_Anime_ZOD, ICreate_Anime_ZOD } from "@actunime/validations";
import { z } from "zod";
import { AnimeManager } from "../../_lib/anime";
import { APIError } from "../../_lib/Error";

export const PatchAnimeRouter = async (
  req: FastifyRequest<{
    Body: {
      data: ICreate_Anime_ZOD;
      note: string;
    };
    Params: {
      id: string;
    };
  }>
) => {
  const { data, note } = z
    .object({ note: z.string().optional(), data: Create_Anime_ZOD })
    .parse(req.body);

  const user = req.currentUser;
  if (!user) throw new APIError("Vous n'êtes pas autorisé !", "UNAUTHORIZED");

  const initAnime = await new AnimeManager(req.session, { user }).init(data);
  await initAnime.patch(req.params.id, note);

  return {
    success: true,
  };
};

export const RequestPatchAnimeRouter = async (
  req: FastifyRequest<{
    Body: {
      data: ICreate_Anime_ZOD;
      note: string;
    };
    Params: {
      id: string;
    };
  }>
) => {
  const { data, note } = z
    .object({ note: z.string().optional(), data: Create_Anime_ZOD })
    .parse(req.body);

  const user = req.currentUser;
  if (!user) throw new APIError("Vous n'êtes pas autorisé !", "UNAUTHORIZED");

  const initAnime = await new AnimeManager(req.session, { user, isRequest: true }).init(data);
  await initAnime.updateRequest(req.params.id, note);

  return {
    success: true,
  };
};
