

import { ReportModel } from "../../../_models/_reportModel";
import { MediaPagination } from "../../../_server-utils/pagination";
import { IReport_Pagination_ZOD, Report_Pagination_ZOD } from "../../../_validation/reportZOD";
import { FastifyRequest } from "fastify";



// TODO Mettre une restriction d'accès.
export async function Filter(req: FastifyRequest<{ Querystring: { pagination?: string } }>) {
  try {
    const paramPagination = JSON.parse(req.query.pagination || "{}");

    const data = Report_Pagination_ZOD.parse(paramPagination || {});

    const pagination = new MediaPagination({
      model: ReportModel,
    })

    const query = data.query;
    const sort = data.sort;

    pagination.addSearchQuery([
      ...(query?.status ? [{ status: query.status }] : []),
      ...(query?.by ? [{ by: query.by }] : []),
      ...(query?.author ? [{ author: query.author }] : []),
      ...(query?.target ? [{ target: query.target }] : []),
      ...(query?.targetPath ? [{ targetPath: query.targetPath }] : []),
    ])

    if (sort)
      pagination.setSort(sort);

    const response = await pagination.getResults();

    // CreatePublicReport('FILTER', {
    //     author: session.user._id,
    //     targetPath: 'Report',
    // })

    return new Response(JSON.stringify(response), { status: 200 });
  } catch (error: any) {
    console.error(error);
    const res = new Response("Bad request", { status: 400 });
    return res;
  }
}