import { FastifyInstance } from "fastify";
import { AuthHandlers } from "../handlers/auth.handlers";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { Utilchema } from "../schema/util.schema";
import { Anime_Pagination_ZOD } from "@actunime/validations";
import { AnimeHandlers } from "../handlers/anime.handlers";

function AnimeRoutes(fastify: FastifyInstance) {
    const app = fastify.withTypeProvider<ZodTypeProvider>();

    app.route({
        method: "POST",
        url: "/",
        schema: {
            description: "Permet de filtrer les animes",
            tags: ["Anime"],
            body: Anime_Pagination_ZOD.partial(),
            response: {
                200: Utilchema.ResponseBody(),
                401: Utilchema.UnauthorizedResponseBody()
            }
        },
        handler: AnimeHandlers.filterAnime
    });

    app.route({
        method: "GET",
        url: "/:id",
        schema: {
            description: "Permet de récupérer un anime via son identifiant",
            tags: ["Anime"],
            response: {
                200: Utilchema.ResponseBody(),
                401: Utilchema.UnauthorizedResponseBody()
            }
        },
        handler: () => { }
    });



    app.route({
        method: "POST",
        url: "/create",
        schema: {
            description: "Permet en tant que modérateur d'ajouter un anime",
            tags: ["Anime"],
            response: {
                200: Utilchema.ResponseBody(),
                401: Utilchema.UnauthorizedResponseBody()
            }
        },
        preHandler: AuthHandlers.AuthRoles(["MODERATOR", "ANIME_MODERATOR"]),
        handler: () => { }
    });

    app.route({
        method: "POST",
        url: "/request",
        schema: {
            description: "Permet de faire la demande d'ajout d'un anime",
            tags: ["Anime"],
            response: {
                200: Utilchema.ResponseBody(),
                401: Utilchema.UnauthorizedResponseBody()
            }
        },
        handler: () => { }
    });

    app.route({
        method: "GET",
        url: "/request/:id",
        schema: {
            description: "Permet de récupérer la demande d'ajout d'un anime",
            tags: ["Anime"],
            response: {
                200: Utilchema.ResponseBody(),
                401: Utilchema.UnauthorizedResponseBody()
            }
        },
        handler: () => { }
    });


    app.route({
        method: "POST",
        url: "/request/update",
        schema: {
            description: "Permet de mettre a jour la demande d'ajout d'un anime",
            tags: ["Anime"],
            response: {
                200: Utilchema.ResponseBody(),
                401: Utilchema.UnauthorizedResponseBody()
            }
        },
        // Faudrait que l'auteur puisse modifier sa requête ou la supprimer
        preHandler: AuthHandlers.AuthRoles(["MODERATOR", "ANIME_MODERATOR"]),
        handler: () => { }
    });

    app.route({
        method: "POST",
        url: "/request/validate",
        schema: {
            description: "Permet de valider la demande d'ajout d'un anime",
            tags: ["Anime"],
            response: {
                200: Utilchema.ResponseBody(),
                401: Utilchema.UnauthorizedResponseBody()
            }
        },
        preHandler: AuthHandlers.AuthRoles(["MODERATOR", "ANIME_MODERATOR"]),
        handler: () => { }
    });

    app.route({
        method: "POST",
        url: "/request/refuse",
        schema: {
            description: "Permet de refusé la demande d'ajout d'un anime",
            tags: ["Anime"],
            response: {
                200: Utilchema.ResponseBody(),
                401: Utilchema.UnauthorizedResponseBody()
            }
        },
        preHandler: AuthHandlers.AuthRoles(["MODERATOR", "ANIME_MODERATOR"]),
        handler: () => { }
    });


    app.route({
        method: "POST",
        url: "/request/delete",
        schema: {
            description: "Permet de supprimé la demande d'ajout d'un anime",
            tags: ["Anime"],
            response: {
                200: Utilchema.ResponseBody(),
                401: Utilchema.UnauthorizedResponseBody()
            }
        },
        preHandler: AuthHandlers.AuthRoles(["MODERATOR", "ANIME_MODERATOR"]),
        handler: () => { }
    });
}

export default AnimeRoutes;