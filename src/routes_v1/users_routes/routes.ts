import { FastifyInstance } from "fastify";
import { AuthValidation } from "../../_lib/auth";
import { PatchUserProfileRouter } from "./_user.profile";
import { addSessionHandler } from "../../_utils/_mongooseSession";
import { PatchUserPreferencesRouter } from "./_user.preferences";
// import { MeRouter } from "./_me";
import { PatchUserAnimeToListeRouter, DeleteUserAnimeToListeRouter } from "./_user.animeListe";

export async function Users_Routes_V1(fastify: FastifyInstance) {
    fastify.route({
        method: "GET",
        url: "/me",
        preValidation: [AuthValidation(["MEMBER"], false, true)],
        preHandler: [addSessionHandler],
        handler: (req) => req.currentUser,
    });

    fastify.route({
        method: "POST",
        url: "/me/patch/profile",
        preValidation: AuthValidation(["MEMBER"], true, true),
        preHandler: [addSessionHandler],
        handler: PatchUserProfileRouter,
    });

    fastify.route({
        method: "POST",
        url: "/me/patch/preferences",
        preValidation: AuthValidation(["MEMBER"], true, true),
        preHandler: [addSessionHandler],
        handler: PatchUserPreferencesRouter,
    });

    fastify.route({
        method: "POST",
        url: "/me/patch/animeListe",
        preValidation: AuthValidation(["MEMBER"], true, true),
        preHandler: [addSessionHandler],
        handler: PatchUserAnimeToListeRouter,
    });

    fastify.route({
        method: "POST",
        url: "/me/delete/animeListe",
        preValidation: AuthValidation(["MEMBER"], true, true),
        preHandler: [addSessionHandler],
        handler: DeleteUserAnimeToListeRouter,
    });
}
