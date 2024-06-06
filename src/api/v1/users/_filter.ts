import { UserModel } from '../../../_models/_userModel';
import { MediaPagination } from '../../../_server-utils/pagination';
import { User_Pagination_ZOD } from '../../../_validation/userZOD';
import { FastifyRequest } from 'fastify';

export async function Filter(req: FastifyRequest<{ Querystring: { pagination?: string } }>) {
  try {
    const paramPagination = JSON.parse(req.query.pagination || '{}');

    const data = User_Pagination_ZOD.parse(paramPagination || {});

    const pagination = new MediaPagination({
      model: UserModel
    });

    const query = data.query;

    if (query?.name) {
      pagination.searchByName(query.name, 'username');
      pagination.searchByName(query.name, 'displayName');
    }

    const response = await pagination.getResults();

    await UserModel.populate(response.results, 'disabled');
    await UserModel.populate(response.results, 'premium');

    return new Response(JSON.stringify(response), { status: 200 });
  } catch (error: any) {
    console.error(error);
    const res = new Response('Bad request', { status: 400 });
    return res;
  }
}
