import { FastifyRequest } from "fastify";
import { GroupeManager } from "../../_lib/groupe";
import { FilterRouter, GetRouter } from "../../_lib/interfaces";
import { Groupe_Pagination_ZOD } from "@actunime/validations";

export const GetGroupeRouter = async (
  req: FastifyRequest<GetRouter>
) => {
  const paramWithMedia = req.query.withMedia;
  const JSONWithMedia = JSON.parse(paramWithMedia || "{}");
  const groupe = await new GroupeManager(req.session, { user: req.currentUser }).get(
    req.params.id,
    JSONWithMedia,
  );

  return groupe;
};

export const FilterGroupeRouter = async (
  req: FastifyRequest<FilterRouter>
) => {
  const paramPagination = JSON.parse(req.query.pagination || "{}");
  const data = Groupe_Pagination_ZOD.parse(paramPagination);
  const groupe = await new GroupeManager(req.session, { user: req.currentUser }).filter(data);

  return groupe;
};
