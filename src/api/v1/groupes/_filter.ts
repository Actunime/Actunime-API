import { GroupeModel } from '../../../_models/_groupeModel';
import { MediaPagination } from '../../../_server-utils/pagination';
import { Groupe_Pagination_ZOD } from '../../../_validation/groupeZOD';
import { FastifyRequest } from 'fastify';

export async function Filter(req: FastifyRequest<{ Querystring: { pagination?: string } }>) {
  try {
    const paramPagination = JSON.parse(req.query.pagination || '{}');

    const data = Groupe_Pagination_ZOD.parse(paramPagination || {});

    const pagination = new MediaPagination({
      model: GroupeModel
    });

    const query = data.query;
    const sort = data.sort;

    if (query?.name) pagination.searchByName(query.name, 'name');

    if (sort) pagination.setSort(sort);

    const response = await pagination.getResults();

    if (data.with?.animes)
      await GroupeModel.populate(response.results, { path: 'animes', select: '-_id' });

    if (data.with?.mangas)
      await GroupeModel.populate(response.results, { path: 'mangas', select: '-_id' });

    return new Response(JSON.stringify(response), { status: 200 });
  } catch (error: any) {
    console.error(error);
    const res = new Response('Bad request', { status: 400 });
    return res;
  }
}
