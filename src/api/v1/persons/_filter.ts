import { PersonModel } from '../../../_models/_personModel';
import { MediaPagination } from '../../../_server-utils/pagination';
import { Person_Pagination_ZOD } from '../../../_validation/personZOD';
import { FastifyRequest } from 'fastify';

export async function Filter(req: FastifyRequest<{ Querystring: { pagination?: string } }>) {
  try {
    const paramPagination = JSON.parse(req.query.pagination || '{}');

    const data = Person_Pagination_ZOD.parse(paramPagination || {});

    const pagination = new MediaPagination({
      model: PersonModel
    });

    const query = data.query;
    const sort = data.sort;

    if (query?.name) pagination.searchByName(query.name, 'name.full');

    if (sort) pagination.setSort(sort);

    const response = await pagination.getResults();

    return new Response(JSON.stringify(response), { status: 200 });
  } catch (error: any) {
    console.error(error);
    const res = new Response('Bad request', { status: 400 });
    return res;
  }
}
