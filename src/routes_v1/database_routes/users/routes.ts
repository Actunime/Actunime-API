import { FastifyInstance } from "fastify";
import { GetUser } from "./_getUser";
import { FilterUser } from "./_filterUsers";
import { DeleteUser } from "./_deleteUser";
import { RestoreUser } from "./_restoreUser";
import { AuthValidation } from "../../../_lib/auth";
import { addSessionHandler } from "../../../_utils/_mongooseSession";

export async function Users_Routes_V1(fastify: FastifyInstance) {
    fastify.route({
        method: "GET",
        url: "/users/:id",
        preValidation: [AuthValidation("ADMINISTRATOR", true)],
        preHandler: [addSessionHandler],
        handler: GetUser,
    });

    fastify.route({
        method: "GET",
        url: "/users",
        preValidation: [AuthValidation("ADMINISTRATOR", true)],
        preHandler: [addSessionHandler],
        handler: FilterUser,
    });

    fastify.route({
        method: "POST",
        url: "/users/delete",
        preValidation: [AuthValidation("ADMINISTRATOR", true)],
        preHandler: [addSessionHandler],
        handler: DeleteUser,
    });

    fastify.route({
        method: "POST",
        url: "/users/restore",
        preValidation: [AuthValidation("ADMINISTRATOR", true)],
        preHandler: [addSessionHandler],
        handler: RestoreUser,
    });
}