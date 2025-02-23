import { FastifyRequest, RouteHandler } from "fastify";
import { z } from "zod";
import { AnimeController } from "../controllers/anime.controller";
import { APIResponse } from "../_utils/_response";
import { AnimeCreateBody, AnimePaginationBody, ICreate_Anime_ZOD } from "@actunime/validations";
import { RequestUtil } from "../_utils/_request";
import { UserControllers } from "../controllers/user.controllers";
import { IAnime, PatchTypeObj, TargetPathObj } from "@actunime/types";
import { genPublicID } from "@actunime/utils";
import { GroupeController } from "../controllers/groupe.controllers";
import { APIError } from "../_lib/Error";
import { PatchControllers } from "../controllers/patch";

const getAnimeById: RouteHandler = async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const controller = new AnimeController(req.session);
    const res = await controller.getById(id);
    return new APIResponse({ success: true, data: res });
}

const filterAnime = async (req: FastifyRequest<{ Body: z.infer<typeof AnimePaginationBody> }>) => {
    const token = RequestUtil.getToken(req, true);

    let onlyVerified = true;
    if (token) {
        const user = await UserControllers.getUserByToken(token);
        if (user.preferences.displayUnverifiedMedia)
            onlyVerified = false;
    }

    const animes = await new AnimeController(req.session).filter(req.body, { onlyVerified })
    return new APIResponse({ success: true, data: animes });
}

const moderator_create_anime = async (req: FastifyRequest<{ Body: z.infer<typeof AnimeCreateBody> }>) => {
    const token = RequestUtil.getToken(req);
    const user = await UserControllers.getUserByToken(token)!;

    const description = req.body.description;
    const input: ICreate_Anime_ZOD = req.body.data;

    // Médias attachées
    const { groupe, parent, cover, banner, manga, companys, staffs, characters, tracks, ...rawAnime } = input;
    const anime: Partial<IAnime> = { ...rawAnime };

    const refId = genPublicID(8);
    const controller = new AnimeController(req.session, user);

    if (groupe)
        anime.groupe = await new GroupeController(req.session, user).create_relation(groupe, { refId, description, type: "CREATE" });

    if (parent)
        anime.parent = await controller.create_relation(parent);

    const res = await controller.create_patch(anime, { type: "MODERATOR_CREATE", description });

    return new APIResponse({ success: true, data: res });

}

export const AnimeHandlers = {
    getAnimeById,
    filterAnime
};