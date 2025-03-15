import { FastifyRequest, RouteHandlerMethod } from "fastify";
import { z } from "zod";
import { AnimeController } from "../controllers/anime.controller";
import { APIResponse } from "../_utils/_response";
import { AnimePaginationBody, IAnimeCreateBody, ICreate_Anime_ZOD, IMediaDeleteBody } from "@actunime/validations";

const getAnimeById: RouteHandlerMethod = async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const controller = new AnimeController(req.mongooseSession);
    const res = await controller.getById(id);
    return new APIResponse({ success: true, data: res });
}

const filterAnime = async (req: FastifyRequest<{ Body: z.infer<typeof AnimePaginationBody> }>) => {
    const animes = await new AnimeController(req.mongooseSession).filter(req.body)
    return new APIResponse({ success: true, data: animes });
}

const createAnime = async (req: FastifyRequest<{ Body: IAnimeCreateBody }>) => {
    const user = req.me!;

    const description = req.body.description;
    const input: ICreate_Anime_ZOD = req.body.data;

    // Médias attachées
    const controller = new AnimeController(req.mongooseSession, { log: req.logSession, user });
    // const anime = await controller.build(input, { refId, description });

    const res = await controller.create(input, { description });

    return new APIResponse({ success: true, data: res });
}

const updateAnime = async (req: FastifyRequest<{ Body: IAnimeCreateBody, Params: { id: string } }>) => {
    const user = req.me!;

    const description = req.body.description;
    const input: ICreate_Anime_ZOD = req.body.data;

    // Médias attachées
    const controller = new AnimeController(req.mongooseSession, { log: req.logSession, user });

    const res = await controller.update(req.params.id, input, { description });

    return new APIResponse({ success: true, data: res });
}

const deleteAnime = async (req: FastifyRequest<{ Body: IMediaDeleteBody, Params: { id: string } }>) => {
    const user = req.me!;

    // Médias attachées
    const controller = new AnimeController(req.mongooseSession, { log: req.logSession, user });

    const res = await controller.delete(req.params.id, req.body);

    return new APIResponse({ success: res });
}

export const AnimeHandlers = {
    getAnimeById,
    filterAnime,
    createAnime,
    updateAnime,
    deleteAnime
};