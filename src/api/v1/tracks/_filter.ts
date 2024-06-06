import { TrackModel } from '../../../_models/_trackModel';
import { MediaPagination } from '../../../_server-utils/pagination';
import { Track_Pagination_ZOD } from '../../../_validation/trackZOD';
import { FastifyRequest } from 'fastify';

export async function Filter(req: FastifyRequest<{ Querystring: { pagination?: string } }>) {
  try {
    const paramPagination = JSON.parse(req.query.pagination || '{}');

    const data = Track_Pagination_ZOD.parse(paramPagination || {});

    const pagination = new MediaPagination({
      model: TrackModel
    });

    const query = data.query;
    const sort = data.sort;

    if (query?.name) pagination.searchByName(query.name, 'name.full');

    if (sort) pagination.setSort(sort);

    const response = await pagination.getResults();
    if (data.with?.artists) await TrackModel.populate(response.results, 'artists.data');

    // CreatePublicTrack('FILTER', {
    //     author: session.user._id,
    //     targetPath: 'Track',
    // })

    return new Response(JSON.stringify(response), { status: 200 });
  } catch (error: any) {
    console.error(error);
    const res = new Response('Bad request', { status: 400 });
    return res;
  }
}
