import { FastifyRequest } from "fastify";
import { MangaManager } from "../../_lib/manga";
import { FilterRouter, GetRouter } from "../../_lib/interfaces";
import { Manga_Pagination_ZOD } from "@actunime/validations";

export const GetMangaRouter = async (
  req: FastifyRequest<GetRouter>,
) => {
  const paramWithMedia = req.query.withMedia;
  const JSONWithMedia = JSON.parse(paramWithMedia || "{}");
  const manga = await new MangaManager(req.session, { user: req.currentUser }).get(
    req.params.id,
    JSONWithMedia,
  );

  return manga;
};

export const FilterMangaRouter = async (
  req: FastifyRequest<FilterRouter>
) => {
  const paramPagination = JSON.parse(req.query.pagination || "{}");
  const data = Manga_Pagination_ZOD.parse(paramPagination);
  const manga = await new MangaManager(req.session, { user: req.currentUser }).filter(data);

  return manga;
};
