

import { MangaModel } from "../../../_models/_mangaModel";
import { FastifyRequest } from "fastify";




export async function Get(req: FastifyRequest<{ Params: { id: string } }>) {
    const findManga = await MangaModel.findOne({ id: req.params.id }).select('-_id');

    if (!findManga) {
        return new Response("Manga not found", { status: 404 });
    }

    return new Response(JSON.stringify(findManga.toJSON()), { status: 200 });
}