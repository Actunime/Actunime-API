import { UpdateModel } from '../../../_models';
import { MediaPagination } from '../../../_server-utils/pagination';
import { RestrictedAPIRoute } from '../../../_server-utils/restricted';
import { Update_Pagination_ZOD } from '../../../_validation/updateZOD';
import { FastifyRequest } from 'fastify';

export async function Filter(req: FastifyRequest<{ Querystring: { pagination?: string } }>) {
  return await RestrictedAPIRoute(
    'ADMINISTRATOR',
    () => new Response("Vous n'etes pas autorisé.", { status: 401 }),
    async (user) => {
      try {
        const paramPagination = JSON.parse(req.query.pagination || '{}');
        const data = Update_Pagination_ZOD.parse(paramPagination || {});

        const pagination = new MediaPagination({
          model: UpdateModel
        });

        pagination.setPagination({ page: data.page, limit: data.limit });

        const query = data.query;
        const sort = data.sort;

        if (data.strict) pagination.setStrict(data.strict);

        pagination.addSearchQuery([
          ...(query?.status
            ? [
                Array.isArray(query.status)
                  ? { status: { $in: query.status } }
                  : { status: query.status }
              ]
            : []),
          ...(query?.actionLabel ? [{ 'actions.label': query.actionLabel }] : []),
          ...(query?.actionUser ? [{ 'actions.user.id': query.actionUser }] : []),
          ...(query?.type
            ? [Array.isArray(query.type) ? { type: { $in: query.type } } : { type: query.type }]
            : []),
          ...(query?.author ? [{ 'author.id': query.author }] : []),
          ...(query?.target ? [{ 'target.id': query.target }] : []),
          ...(query?.targetPath
            ? [
                Array.isArray(query.targetPath)
                  ? { targetPath: { $in: query.targetPath } }
                  : { targetPath: query.targetPath }
              ]
            : []),
          ...(query?.ref ? [{ 'ref.id': query.ref }] : [])
        ]);

        if (sort) pagination.setSort(sort);

        const response = await pagination.getResults();

        if (data.with?.author) await UpdateModel.populate(response.results, 'author.data');

        if (data.with?.target) await UpdateModel.populate(response.results, 'target.data');

        if (data.with?.ref) await UpdateModel.populate(response.results, 'ref.data');

        if (data.with?.actions) await UpdateModel.populate(response.results, 'actions.user.data');

        return new Response(JSON.stringify(response), { status: 200 });
      } catch (error: any) {
        console.error(error);
        const res = new Response('Bad request', { status: 400 });
        return res;
      }
    }
  );
}
