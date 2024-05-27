

import { AnimeModel } from "../../../_models/_animeModel";
import { MediaPagination } from "../../../_server-utils/pagination";
import { Anime_Pagination_ZOD, IAnime_Pagination_ZOD } from "../../../_validation/animeZOD";
import { FastifyRequest } from "fastify";


export async function Filter(req: FastifyRequest<{ Querystring: { pagination?: string } }>) {
    try {
        const paramPagination = JSON.parse(req.query.pagination || "{}");
        const data = Anime_Pagination_ZOD.parse(paramPagination);

        const pagination = new MediaPagination({
            model: AnimeModel,
        })

        pagination.setPagination({ page: data.page, limit: data.limit })

        const query = data.query;
        const sort = data.sort;

        if (query?.name)
            pagination.searchByName(query.name, "title.default");

        if (data.strict) {
            pagination.setStrict(data.strict);
        } else if (query?.name) // Si c'est pas en strict chercher aussi dans les alias
            pagination.searchByName(query.name, "title.alias");
        // Le strict risque de faire que les noms doivent correspondre tout les deux a la recherche

        if (sort)
            pagination.setSort(sort);

        const response = await pagination.getResults();

        if (data.with?.groupe)
            await AnimeModel.populate(response.results, { path: 'groupe.data', select: '-_id' });
        if (data.with?.parent)
            await AnimeModel.populate(response.results, { path: 'parent.data', select: '-_id' });
        if (data.with?.source)
            await AnimeModel.populate(response.results, { path: 'source.data', select: '-_id' });
        if (data.with?.staffs)
            await AnimeModel.populate(response.results, { path: 'staffs.data', select: '-_id' });
        if (data.with?.companys)
            await AnimeModel.populate(response.results, { path: 'companys.data', select: '-_id' });
        if (data.with?.characters)
            await AnimeModel.populate(response.results, { path: 'characters.data', select: '-_id' });
        if (data.with?.tracks)
            await AnimeModel.populate(response.results, { path: 'tracks.data', select: '-_id' });



        return new Response(JSON.stringify(response), { status: 200 });
    } catch (error: any) {
        console.error(error);
        const res = new Response("Bad request", { status: 400 });
        return res;
    }
}