import { FastifyRequest } from "fastify";
import { PersonManager } from "../../_lib/person";
import { FilterRouter, GetRouter } from "../../_lib/interfaces";
import { Person_Pagination_ZOD } from "@actunime/validations";

export const GetPersonRouter = async (
  req: FastifyRequest<GetRouter>
) => {
  const paramWithMedia = req.query.withMedia;
  const JSONWithMedia = JSON.parse(paramWithMedia || "{}");
  const person = await new PersonManager(req.session, { user: req.currentUser }).get(
    req.params.id,
    JSONWithMedia,
  );

  return person;
};

export const FilterPersonRouter = async (
  req: FastifyRequest<FilterRouter>
) => {
  const paramPagination = JSON.parse(req.query.pagination || "{}");
  const data = Person_Pagination_ZOD.parse(paramPagination);
  const person = await new PersonManager(req.session, { user: req.currentUser }).filter(data);

  return person;
};
