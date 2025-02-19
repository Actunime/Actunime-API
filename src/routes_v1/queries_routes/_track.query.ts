import { FastifyRequest } from "fastify";
import { TrackManager } from "../../_lib/track";
import { FilterRouter, GetRouter } from "../../_lib/interfaces";
import { Track_Pagination_ZOD } from "@actunime/validations";

export const GetTrackRouter = async (
  req: FastifyRequest<GetRouter>,
) => {
  const paramWithMedia = req.query.withMedia;
  const JSONWithMedia = JSON.parse(paramWithMedia || "{}");
  const track = await new TrackManager(req.session, { user: req.currentUser }).get(
    req.params.id,
    JSONWithMedia,
  );


  return track;
};

export const FilterTrackRouter = async (
  req: FastifyRequest<FilterRouter>
) => {
  const paramPagination = JSON.parse(req.query.pagination || "{}");
  const data = Track_Pagination_ZOD.parse(paramPagination);
  const track = await new TrackManager(req.session, { user: req.currentUser }).filter(data);

  return track;
};
