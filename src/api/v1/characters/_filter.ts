import { CharacterModel } from '../../../_models/_characterModel';
import { MediaPagination } from '../../../_server-utils/pagination';
import { Character_Pagination_ZOD } from '../../../_validation/characterZOD';
import { FastifyRequest } from 'fastify';

export async function Filter(req: FastifyRequest<{ Querystring: { pagination?: string } }>) {
  try {
    const paramPagination = JSON.parse(req.query.pagination || '{}');
    const data = Character_Pagination_ZOD.parse(paramPagination || {});

    const pagination = new MediaPagination({
      model: CharacterModel
    });

    const query = data.query;
    const sort = data.sort;

    if (query?.name) pagination.searchByName(query.name, 'name.full');

    if (sort) pagination.setSort(sort);

    const response = await pagination.getResults();

    if (data.with?.actors) await CharacterModel.populate(response, 'actors.data');

    return new Response(JSON.stringify(response), { status: 200 });
  } catch (error: any) {
    console.error(error);
    const res = new Response('Bad request', { status: 400 });
    return res;
  }
}
