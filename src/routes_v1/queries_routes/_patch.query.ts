import { FastifyRequest } from "fastify";
import { PatchManager } from "../../_lib/patch";
import { FilterRouter, GetRouter } from "../../_lib/interfaces";
import { Patch_Pagination_ZOD } from "@actunime/validations";
import { APIError } from "../../_lib/Error";

export const GetPatchRouter = async (
  req: FastifyRequest<GetRouter>,
) => {
  const paramWithMedia = req.query.withMedia;
  const JSONWithMedia = JSON.parse(paramWithMedia || "{}");

  const user = req.currentUser;
  if (!user) throw new APIError("Vous n'êtes pas autorisé !", "UNAUTHORIZED");

  const patch = await new PatchManager(req.session, { user }).get(
    req.params.id,
    JSONWithMedia,
  );
  return patch;
};

export const FilterPatchRouter = async (
  req: FastifyRequest<FilterRouter>
) => {
  const paramPagination = JSON.parse(req.query.pagination || "{}");
  const data = Patch_Pagination_ZOD.parse(paramPagination);

  const user = req.currentUser;
  if (!user) throw new APIError("Vous n'êtes pas autorisé !", "UNAUTHORIZED");

  const patch = await new PatchManager(req.session, { user }).filter(data);
  return patch;
};
