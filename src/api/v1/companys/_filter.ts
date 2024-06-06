import { CompanyModel } from '../../../_models/_companyModel';
import { MediaPagination } from '../../../_server-utils/pagination';
import { Company_Pagination_ZOD, ICompany_Pagination_ZOD } from '../../../_validation/companyZOD';
import { FastifyRequest } from 'fastify';

export async function Filter(req: FastifyRequest<{ Querystring: { pagination?: string } }>) {
  try {
    const paramPagination = JSON.parse(req.query.pagination || 'object');

    const data = Company_Pagination_ZOD.parse(paramPagination || object);

    const pagination = new MediaPagination({
      model: CompanyModel
    });

    const query = data.query;
    const sort = data.sort;

    if (query?.name) pagination.searchByName(query.name, 'name');

    if (query?.type) pagination.addSearchQuery([{ type: query.type }]);

    if (sort) pagination.setSort(sort);

    const response = await pagination.getResults();

    return new Response(JSON.stringify(response), { status: 200 });
  } catch (error: any) {
    console.error(error);
    const res = new Response('Bad request', { status: 400 });
    return res;
  }
}
