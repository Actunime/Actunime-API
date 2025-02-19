import { FastifyRequest } from "fastify";
import { CompanyManager } from "../../_lib/company";
import { FilterRouter, GetRouter } from "../../_lib/interfaces";
import { Company_Pagination_ZOD } from "@actunime/validations";

export const GetCompanyRouter = async (
  req: FastifyRequest<GetRouter>
) => {
  const paramWithMedia = req.query.withMedia;
  const JSONWithMedia = JSON.parse(paramWithMedia || "{}");
  const company = await new CompanyManager(req.session, { user: req.currentUser }).get(
    req.params.id,
    JSONWithMedia,
  );

  return company;
};

export const FilterCompanyRouter = async (
  req: FastifyRequest<FilterRouter>
) => {
  const paramPagination = JSON.parse(req.query.pagination || "{}");
  const data = Company_Pagination_ZOD.parse(paramPagination);
  const company = await new CompanyManager(req.session, { user: req.currentUser }).filter(data);

  return company;
};
