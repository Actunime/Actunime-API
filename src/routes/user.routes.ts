import { FastifyInstance } from "fastify";
import { UserHandlers } from "../handlers/user.handlers";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { UserMutationBody } from "@actunime/validations";
import { addSessionHandler } from "../_utils";
import { AddLogSession } from "../_utils/_logSession";

function UserRoutes(fastify: FastifyInstance) {
    const app = fastify.withTypeProvider<ZodTypeProvider>();

    app.get("/:id", {
        schema: {
            description: "",
            tags: ["User"]
        },
    }, UserHandlers.getUserById);

    app.get("/me", {
        schema: {
            description: "",
            tags: ["User"]
        },
    }, UserHandlers.getCurrentUser);

    app.route({
        url: "/account/:id",
        method: "GET",
        schema: {
            description: "",
            tags: ["User"]
        },
        preHandler: [fastify.authenticate],
        handler: UserHandlers.getUserByAccountId
    });

    app.route({
        method: "POST",
        url: "/me/update",
        schema: {
            description: "",
            tags: ["User"],
            body: UserMutationBody
        },
        preHandler: [fastify.authenticate, addSessionHandler, AddLogSession],
        handler: UserHandlers.updateCurrentUser
    });
}

export default UserRoutes;