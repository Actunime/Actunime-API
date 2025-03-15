import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { Utilchema } from "../schema/util.schema";
import { AnimeCreateBody, AnimePaginationBody } from "@actunime/validations";
import { AnimeHandlers } from "../handlers/anime.handlers";
import { addSessionHandler } from "../_utils";
import { AddLogSession } from "../_utils/_logSession";
import { APIError } from "../_lib/Error";

function AnimeRoutes(fastify: FastifyInstance) {
    const app = fastify.withTypeProvider<ZodTypeProvider>();
    const tags = ["Anime"];

    /** GET */

    app.route({
        method: "GET",
        url: "/:id",
        schema: {
            description: "Récupération d'un anime",
            tags,
            response: {
                200: Utilchema.ResponseBody(),
            }
        },
        handler: AnimeHandlers.getAnimeById
    });

    app.route({
        method: "GET",
        url: "/:id/stats",
        schema: {
            description: "Récupération des statistiques d'un anime",
            tags,
            response: {
                200: Utilchema.ResponseBody(),
                401: Utilchema.UnauthorizedResponseBody()
            }
        },
        handler: () => {
            throw new APIError("Cette route n'est pas encore disponible", "NOT_FOUND");
        }
    });

    /** POST */

    app.route({
        method: "POST",
        url: "/",
        schema: {
            description: "Filtrer les animes",
            tags,
            body: AnimePaginationBody.partial(),
            response: {
                200: Utilchema.ResponseBody(),
                401: Utilchema.UnauthorizedResponseBody()
            }
        },
        handler: AnimeHandlers.filterAnime
    });

    app.route({
        method: "POST",
        url: "/create",
        schema: {
            description: "Crée un anime",
            tags,
            body: AnimeCreateBody,
            response: {
                200: Utilchema.ResponseBody()
            }
        },
        preHandler: [fastify.authenticateRoles(["ANIME_MODERATOR"]), fastify.keycloakRoles(["ANIME_ADD"]), addSessionHandler, AddLogSession],
        handler: AnimeHandlers.createAnime
    });

    app.route({
        method: "POST",
        url: "/:id/update",
        schema: {
            description: "Mettre a jour un anime",
            tags,
            response: {
                200: Utilchema.ResponseBody(),
                401: Utilchema.UnauthorizedResponseBody()
            }
        },
        preHandler: [fastify.keycloakRoles(["ANIME_PATCH"]), addSessionHandler, AddLogSession],
        handler: AnimeHandlers.updateAnime
    });

    app.route({
        method: "POST",
        url: "/:id/delete",
        schema: {
            description: "Supprimer un anime",
            tags,
            response: {
                200: Utilchema.ResponseBody(),
            }
        },
        preHandler: [fastify.keycloakRoles(["ANIME_DELETE"]), addSessionHandler, AddLogSession],
        handler: AnimeHandlers.deleteAnime
    });

    app.route({
        method: "POST",
        url: "/:id/verify",
        schema: {
            description: "Vérifier un anime",
            tags,
            response: {
                200: Utilchema.ResponseBody(),
                401: Utilchema.UnauthorizedResponseBody()
            }
        },
        preHandler: [fastify.keycloakRoles(["ANIME_VERIFY"]), addSessionHandler, AddLogSession],
        handler: () => { }
    });

    app.route({
        method: "POST",
        url: "/:id/unverify",
        schema: {
            description: "Dévérifier un anime",
            tags,
            response: {
                200: Utilchema.ResponseBody(),
                401: Utilchema.UnauthorizedResponseBody()
            }
        },
        preHandler: [fastify.keycloakRoles(["ANIME_VERIFY"]), addSessionHandler, AddLogSession],
        handler: () => { }
    });

    app.route({
        method: "POST",
        url: "/:id/requests",
        schema: {
            description: "Filtrer les demandes d'un anime",
            tags,
            response: {
                200: Utilchema.ResponseBody(),
                401: Utilchema.UnauthorizedResponseBody()
            }
        },
        preHandler: () => { },
        handler: () => { }
    });


    app.route({
        method: "POST",
        url: "/:mediaId/requests/:reqId/update",
        schema: {
            description: "Mettre a jour la demande d'un anime",
            tags,
            response: {
                200: Utilchema.ResponseBody(),
                401: Utilchema.UnauthorizedResponseBody()
            }
        },
        preHandler: [fastify.keycloakRoles(["ANIME_REQUEST_PATCH"]), addSessionHandler, AddLogSession],
        handler: () => { }
    });

    app.route({
        method: "POST",
        url: "/:mediaId/requests/:reqId/accept",
        schema: {
            description: "Accepter la demande d'un anime",
            tags,
            response: {
                200: Utilchema.ResponseBody(),
                401: Utilchema.UnauthorizedResponseBody()
            }
        },
        preHandler: [fastify.keycloakRoles(["ANIME_REQUEST_VERIFY"]), addSessionHandler, AddLogSession],
        handler: () => { }
    });

    app.route({
        method: "POST",
        url: "/:mediaId/requests/:reqId/refuse",
        schema: {
            description: "Refuser la demande d'un anime",
            tags,
            response: {
                200: Utilchema.ResponseBody(),
                401: Utilchema.UnauthorizedResponseBody()
            }
        },
        preHandler: [fastify.keycloakRoles(["ANIME_REQUEST_VERIFY"]), addSessionHandler, AddLogSession],
        handler: () => { }
    });

    app.route({
        method: "POST",
        url: "/:mediaId/requests/:reqId/delete",
        schema: {
            description: "Supprimer la demande d'un anime",
            tags,
            response: {
                200: Utilchema.ResponseBody(),
                401: Utilchema.UnauthorizedResponseBody()
            }
        },
        preHandler: [fastify.keycloakRoles(["ANIME_DELETE", "ANIME_REQUEST_DELETE"], false), addSessionHandler, AddLogSession],
        handler: () => { }
    });
}

export default AnimeRoutes;