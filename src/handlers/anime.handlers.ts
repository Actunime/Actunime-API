import { FastifyRequest, RouteHandler } from "fastify";
import { z } from "zod";
import { AnimeController } from "../controllers/anime.controller";
import { APIResponse } from "../_utils/_response";
import { AnimeCreateBody, AnimePaginationBody, ICreate_Anime_ZOD } from "@actunime/validations";
import { RequestUtil } from "../_utils/_request";
import { UserControllers } from "../controllers/user.controllers";
import { IAnime } from "@actunime/types";
import { genPublicID } from "@actunime/utils";
import { GroupeController } from "../controllers/groupe.controllers";
import { ImageController } from "../controllers/image.controllers";
import { MangaController } from "../controllers/manga.controller";
import { CompanyController } from "../controllers/company.controller";
import { PersonController } from "../controllers/person.controler";
import { CharacterController } from "../controllers/character.controller";
import { TrackController } from "../controllers/track.controller";

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

const createAnime = async (req: FastifyRequest<{ Body: z.infer<typeof AnimeCreateBody> }>) => {
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
        anime.groupe = await new GroupeController(req.session, user)
            .create_relation(groupe, { refId, description, type: "MODERATOR_CREATE" });

    if (parent)
        anime.parent = await controller.create_relation(parent);

    if (cover || banner) {
        const imageController = new ImageController(req.session, user);

        if (cover)
            anime.cover = await imageController.create_relation(cover,
                { refId, description, type: "MODERATOR_CREATE", targetPath: "Anime" }
            );

        if (banner)
            anime.banner = await imageController.create_relation(banner,
                { refId, description, type: "MODERATOR_CREATE", targetPath: "Anime" }
            );
    }

    if (manga)
        anime.manga = await new MangaController(req.session, user).create_relation(manga);

    if (companys && companys.length > 0) {
        const companyController = new CompanyController(req.session, user);
        anime.companys = await Promise.all(companys.map((company) => {
            return companyController.create_relation(company,
                { refId, description, type: "MODERATOR_CREATE" }
            );
        }));
    }

    if (staffs && staffs.length > 0) {
        const personController = new PersonController(req.session, user);
        anime.staffs = await Promise.all(staffs.map((person) => {
            return personController.create_relation(person,
                { refId, description, type: "MODERATOR_CREATE" }
            );
        }));
    }

    if (characters && characters.length > 0) {
        const characterController = new CharacterController(req.session, user);
        anime.characters = await Promise.all(characters.map((character) => {
            return characterController.create_relation(character,
                { refId, description, type: "MODERATOR_CREATE" }
            );
        }));
    }

    if (tracks && tracks.length > 0) {
        const trackController = new TrackController(req.session, user);
        anime.tracks = await Promise.all(tracks.map((track) => {
            return trackController.create_relation(track,
                { refId, description, type: "MODERATOR_CREATE" }
            );
        }));
    }

    const res = await controller.create_patch(anime,
        { type: "MODERATOR_CREATE", description, pathId: refId }
    );

    return new APIResponse({ success: true, data: res });

}

export const AnimeHandlers = {
    getAnimeById,
    filterAnime,
    createAnime
};