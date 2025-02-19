import { FastifyRequest } from "fastify";
import { UserManager } from "../../_lib/user";
import { FilterRouter, GetRouter } from "../../_lib/interfaces";
import { User_Pagination_ZOD } from "@actunime/validations";

export const GetUserRouter = async (
  req: FastifyRequest<GetRouter>,
) => {
  const paramWithMedia = req.query.withMedia;
  const JSONWithMedia = JSON.parse(paramWithMedia || "{}");
  const user = await new UserManager(req.session, { user: req.currentUser }).get(
    req.params.id,
    JSONWithMedia,
  );

  return user;
};

export const FilterUserRouter = async (
  req: FastifyRequest<FilterRouter>
) => {
  const paramPagination = JSON.parse(req.query.pagination || "{}");
  const data = User_Pagination_ZOD.parse(paramPagination);
  const user = await new UserManager(req.session, { user: req.currentUser }).filter(data);

  return user;
};
