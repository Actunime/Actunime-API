

import { AnimeModel } from "../../../_models/_animeModel";
import { Anime_Pagination_ZOD } from "../../../_validation/animeZOD";
import { FastifyRequest } from "fastify";

export async function Get(req: FastifyRequest<{ Params: { id: string } }>) {
    const findAnime = await AnimeModel.findOne({ id: req.params.id }).select('-_id');

    if (!findAnime) {
        return new Response("Anime not found", { status: 404 });
    }

    const paramWithMedia = new URL(req.url).searchParams.get('withMedia');
    const JSONWithMedia = JSON.parse(paramWithMedia || '{}');
    const data = Anime_Pagination_ZOD.parse({ with: JSONWithMedia });

    if (data.with?.groupe)
        await findAnime.populate({ path: 'groupe.data', select: '-_id', justOne: true });
    if (data.with?.parent)
        await findAnime.populate({ path: 'parent.data', select: '-_id', justOne: true });
    if (data.with?.source)
        await findAnime.populate({ path: 'source.data', select: '-_id', justOne: true });
    if (data.with?.staffs)
        await findAnime.populate({ path: 'staffs.data', select: '-_id', justOne: true });
    if (data.with?.companys)
        await findAnime.populate({ path: 'companys.data', select: '-_id', justOne: true });
    if (data.with?.characters)
        await findAnime.populate({ path: 'characters.data', select: '-_id', justOne: true });
    if (data.with?.tracks)
        await findAnime.populate({ path: 'tracks.data', select: '-_id', justOne: true });

    return new Response(JSON.stringify(findAnime.toJSON()), { status: 200 });
}