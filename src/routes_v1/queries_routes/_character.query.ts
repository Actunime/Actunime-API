import { FastifyRequest } from "fastify";
import { CharacterManager } from "../../_lib/character";
import { FilterRouter, GetRouter } from "../../_lib/interfaces";
import { Character_Pagination_ZOD } from "@actunime/validations";

export const GetCharacterRouter = async (
  req: FastifyRequest<GetRouter>
) => {
  const paramWithMedia = req.query.withMedia;
  const JSONWithMedia = JSON.parse(paramWithMedia || "{}");
  const character = await new CharacterManager(req.session, { user: req.currentUser }).get(
    req.params.id,
    JSONWithMedia,
  );

  return character;
};

export const FilterCharacterRouter = async (
  req: FastifyRequest<FilterRouter>
) => {
  const paramPagination = JSON.parse(req.query.pagination || "{}");
  const data = Character_Pagination_ZOD.parse(paramPagination);
  const characters = await new CharacterManager(req.session, { user: req.currentUser }).filter(data);
  return characters;
};
