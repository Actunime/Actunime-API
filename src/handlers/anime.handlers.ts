import { FastifyRequest, RouteHandler } from "fastify";
import { z } from "zod";
import { AnimeController } from "../controllers/anime.controller";
import { APIResponse } from "../_utils/_response";
import { AnimeCreateBody, AnimePaginationBody, ICreate_Anime_ZOD } from "@actunime/validations";
import { IAnime } from "@actunime/types";
import { genPublicID } from "@actunime/utils";
import { PatchModel } from "@actunime/mongoose-models";

const getAnimeById: RouteHandler = async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const controller = new AnimeController(req.mongooseSession, { log: req.logSession });
    const res = await controller.getById(id);
    return new APIResponse({ success: true, data: res });
}

const filterAnime = async (req: FastifyRequest<{ Body: z.infer<typeof AnimePaginationBody> }>) => {
    let onlyVerified = true;
    const animes = await new AnimeController(req.mongooseSession, { log: req.logSession }).filter(req.body, { onlyVerified })
    return new APIResponse({ success: true, data: animes });
}

const createAnime = async (req: FastifyRequest<{ Body: z.infer<typeof AnimeCreateBody> }>) => {
    const user = req.me!;

    const description = req.body.description;
    const input: ICreate_Anime_ZOD = req.body.data;

    // Médias attachées
    const controller = new AnimeController(req.mongooseSession, { log: req.logSession, user });
    const refId = genPublicID(8);
    const anime = await controller.build(input, { refId, description });

    const res = await controller.create_patch(anime, { type: "MODERATOR_CREATE", description, pathId: refId });

    return new APIResponse({ success: true, data: res });
}

export const AnimeHandlers = {
    getAnimeById,
    filterAnime,
    createAnime
};