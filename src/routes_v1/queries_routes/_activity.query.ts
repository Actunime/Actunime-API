import { FastifyRequest } from "fastify";
import { ActivityManager } from "../../_lib/activity";
import { FilterRouter, GetRouter } from "../../_lib/interfaces";
import { Activity_Pagination_ZOD } from "@actunime/validations";
import { APIError } from "../../_lib/Error";

export const GetActivityRouter = async (
  req: FastifyRequest<GetRouter>,
) => {
  const paramWithMedia = req.query.withMedia;
  const JSONWithMedia = JSON.parse(paramWithMedia || "{}");

  const user = req.currentUser;
  if (!user) throw new APIError("Vous n'êtes pas autorisé !", "UNAUTHORIZED");

  const activity = await new ActivityManager(req.session, { user }).get(
    req.params.id,
    JSONWithMedia,
  );

  return activity;
};

export const FilterActivityRouter = async (
  req: FastifyRequest<FilterRouter>
) => {
  const paramPagination = JSON.parse(req.query.pagination || "{}");
  const data = Activity_Pagination_ZOD.parse(paramPagination);

  const user = req.currentUser;
  if (!user) throw new APIError("Vous n'êtes pas autorisé !", "UNAUTHORIZED");

  const activities = await new ActivityManager(req.session, { user }).filter(data);

  return activities;
};
