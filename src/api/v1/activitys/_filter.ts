import { ActivityModel } from '../../../_models/_activityModel';
import { MediaPagination } from '../../../_server-utils/pagination';
import { Activity_Pagination_ZOD } from '../../../_validation/activityZOD';
import { FastifyRequest } from 'fastify';

// TODO Mettre une restriction d'accès.
export async function Filter(req: FastifyRequest<{ Querystring: { pagination?: string } }>) {
  try {
    const paramPagination = JSON.parse(req.query.pagination || '{}');

    const data = Activity_Pagination_ZOD.parse(paramPagination || {});

    const pagination = new MediaPagination({
      model: ActivityModel
    });

    const query = data.query;
    const sort = data.sort;

    pagination.setStrict(data.strict || false);
    pagination.setPagination({ page: data.page, limit: data.limit });

    pagination.addSearchQuery([
      ...(query?.type ? [{ type: query.type }] : []),
      ...(query?.action ? [{ action: query.action }] : []),
      ...(query?.author ? [{ 'author.id': query.author }] : []),
      ...(query?.target ? [{ 'target.id': query.target }] : []),
      ...(query?.targetPath ? [{ targetPath: query.targetPath }] : [])
    ]);

    if (sort) pagination.setSort(sort);

    const response = await pagination.getResults();

    return new Response(JSON.stringify(response), { status: 200 });
  } catch (error: any) {
    console.error(error);
    const res = new Response('Bad request', { status: 400 });
    return res;
  }
}
