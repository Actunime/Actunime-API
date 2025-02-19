import { FastifyRequest } from "fastify";
import { AnimeManager } from "../../_lib/anime";
import { FilterRouter, GetRouter } from "../../_lib/interfaces";
import { Anime_Pagination_ZOD } from "@actunime/validations";

export const GetAnimeRouter = async (
  req: FastifyRequest<GetRouter>,
) => {
  const paramWithMedia = req.query.withMedia;
  const JSONWithMedia = JSON.parse(paramWithMedia || "{}");
  const anime = await new AnimeManager(req.session, { user: req.currentUser }).get(
    req.params.id,
    JSONWithMedia,
  );

  return anime;
};

export const FilterAnimeRouter = async (
  req: FastifyRequest<FilterRouter>
) => {

  const paramPagination = JSON.parse(req.query.pagination || "{}");
  const data = Anime_Pagination_ZOD.parse(paramPagination);
  const animes = await new AnimeManager(req.session, { user: req.currentUser }).filter(data);

  return animes;
};
