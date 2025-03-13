import { FastifyInstance, FastifyRequest } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { Utilchema } from "../schema/util.schema";
import { AnimeHandlers } from "../handlers/anime.handlers";
import { ITargetPath } from "@actunime/types";

function RequestRoutes(fastify: FastifyInstance) {
    const app = fastify.withTypeProvider<ZodTypeProvider>();
    const tags = ["Request"]
    app.route({
        method: "GET",
        url: "/",
        schema: {
            description: "",
            tags,
            response: {
                200: Utilchema.ResponseBody(),
                401: Utilchema.UnauthorizedResponseBody()
            }
        },
        handler: (req: FastifyRequest<{ Params: { mediaId?: string, id?: string } }>) => {
            console.log(req.params);
        }
    });

    app.route({
        method: "GET",
        url: "/stats",
        schema: {
            description: "",
            tags,
            response: {
                200: Utilchema.ResponseBody(),
                401: Utilchema.UnauthorizedResponseBody()
            }
        },
        handler: () => { }
    });


    app.route({
        method: "GET",
        url: "/:id",
        schema: {
            description: "",
            tags,
            response: {
                200: Utilchema.ResponseBody(),
                401: Utilchema.UnauthorizedResponseBody()
            }
        },
        handler: (req: FastifyRequest<{ Params: { mediaId?: string, id?: string } }>) => {
            console.log(req.params);
        }
    });

    app.route({
        method: "GET",
        url: "/:id/references",
        schema: {
            description: "",
            tags,
            response: {
                200: Utilchema.ResponseBody(),
                401: Utilchema.UnauthorizedResponseBody()
            }
        },
        handler: () => { }
    });


    /** POST */

    app.route({
        method: "POST",
        url: "/:id/update",
        schema: {
            description: "",
            tags,
            response: {
                200: Utilchema.ResponseBody(),
                401: Utilchema.UnauthorizedResponseBody()
            }
        },
        handler: () => { }
    });

    app.route({
        method: "POST",
        url: "/:id/delete",
        schema: {
            description: "",
            tags,
            response: {
                200: Utilchema.ResponseBody(),
                401: Utilchema.UnauthorizedResponseBody()
            }
        },
        handler: () => { }
    });

    app.route({
        method: "POST",
        url: "/:id/accept",
        schema: {
            description: "",
            tags,
            response: {
                200: Utilchema.ResponseBody(),
                401: Utilchema.UnauthorizedResponseBody()
            }
        },
        handler: () => { }
    });

    app.route({
        method: "POST",
        url: "/:id/refuse",
        schema: {
            description: "",
            tags,
            response: {
                200: Utilchema.ResponseBody(),
                401: Utilchema.UnauthorizedResponseBody()
            }
        },
        handler: () => { }
    });
}

export default RequestRoutes;