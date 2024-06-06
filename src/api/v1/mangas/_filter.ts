import { MangaModel } from '../../../_models/_mangaModel';
import { MediaPagination } from '../../../_server-utils/pagination';
import { IManga_Pagination_ZOD, Manga_Pagination_ZOD } from '../../../_validation/mangaZOD';
import { FastifyRequest } from 'fastify';

export async function Filter(req: FastifyRequest<{ Querystring: { pagination?: string } }>) {
  try {
    const paramPagination = JSON.parse(req.query.pagination || 'object');

    const data = Manga_Pagination_ZOD.parse(paramPagination || object);

    const pagination = new MediaPagination({
      model: MangaModel
    });

    const query = data.query;
    const sort = data.sort;

    if (query?.name) pagination.searchByName(query.name, 'name.full');

    if (sort) pagination.setSort(sort);

    const response = await pagination.getResults();

    if (data.with?.groupe) await MangaModel.populate(response.results, 'groupe.data');
    if (data.with?.parent) await MangaModel.populate(response.results, 'parent.data');
    if (data.with?.source) await MangaModel.populate(response.results, 'source.data');
    if (data.with?.staffs) await MangaModel.populate(response.results, 'staffs.data');
    if (data.with?.companys) await MangaModel.populate(response.results, 'companys.data');
    if (data.with?.characters) await MangaModel.populate(response.results, 'characters.data');
    // CreatePublicManga('FILTER', {
    //     author: session.user._id,
    //     targetPath: 'Manga',
    // })

    return new Response(JSON.stringify(response), { status: 200 });
  } catch (error: any) {
    console.error(error);
    const res = new Response('Bad request', { status: 400 });
    return res;
  }
}
