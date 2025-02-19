import { FastifyRequest } from "fastify";
import { ReportManager } from "../../_lib/report";
import { FilterRouter, GetRouter } from "../../_lib/interfaces";
import { Report_Pagination_ZOD } from "@actunime/validations";
import { APIError } from "../../_lib/Error";

export const GetReportRouter = async (
  req: FastifyRequest<GetRouter>
) => {
  const paramWithMedia = req.query.withMedia;
  const JSONWithMedia = JSON.parse(paramWithMedia || "{}");

  const user = req.currentUser;
  if (!user) throw new APIError("Vous n'êtes pas autorisé !", "UNAUTHORIZED");

  const report = await new ReportManager(req.session, { user }).get(
    req.params.id,
    JSONWithMedia,
  );

  return report;
};

export const FilterReportRouter = async (
  req: FastifyRequest<FilterRouter>
) => {
  const paramPagination = JSON.parse(req.query.pagination || "{}");
  const data = Report_Pagination_ZOD.parse(paramPagination);

  const user = req.currentUser;
  if (!user) throw new APIError("Vous n'êtes pas autorisé !", "UNAUTHORIZED");

  const report = await new ReportManager(req.session, { user }).filter(data);

  return report;
};
