import { FastifyRequest } from "fastify";
import { ImageManager } from "../../_lib/image";
import { FilterRouter, GetRouter } from "../../_lib/interfaces";
import { Image_Pagination_ZOD } from "@actunime/validations";

export const GetImageRouter = async (
  req: FastifyRequest<GetRouter>
) => {
  const paramWithMedia = req.query.withMedia;
  const JSONWithMedia = JSON.parse(paramWithMedia || "{}");
  const image = await new ImageManager(req.session, { user: req.currentUser }).get(
    req.params.id,
    JSONWithMedia,
  );

  return image;
};

export const FilterImageRouter = async (
  req: FastifyRequest<FilterRouter>
) => {
  const paramPagination = JSON.parse(req.query.pagination || "{}");
  const data = Image_Pagination_ZOD.parse(paramPagination);
  const image = await new ImageManager(req.session, { user: req.currentUser }).filter(data);

  return image;
};
