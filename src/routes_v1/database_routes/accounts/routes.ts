import { FastifyInstance } from "fastify";
import { GetAccount } from "./_getAccount";
import { FilterAccount } from "./_filterAccounts";
import { DeleteAccount } from "./_deleteAccount";
import { RestoreAccount } from "./_restoreAccount";
import { SetUserToAccount } from "./_setUserToAccount";
import { AuthValidation } from "../../../_lib/auth";
import { addSessionHandler } from "../../../_utils/_mongooseSession";

export async function Accounts_Routes_V1(fastify: FastifyInstance) {
    fastify.route({
        method: "GET",
        url: "/accounts/:id",
        preValidation: [AuthValidation("ADMINISTRATOR", true)],
        preHandler: [addSessionHandler],
        handler: GetAccount,
    });

    fastify.route({
        method: "GET",
        url: "/accounts",
        preValidation: [AuthValidation("ADMINISTRATOR", true)],
        preHandler: [addSessionHandler],
        handler: FilterAccount,
    });

    fastify.route({
        method: "POST",
        url: "/accounts/delete",
        preValidation: [AuthValidation("ADMINISTRATOR", true)],
        preHandler: [addSessionHandler],
        handler: DeleteAccount,
    });

    fastify.route({
        method: "POST",
        url: "/accounts/restore",
        preValidation: [AuthValidation("ADMINISTRATOR", true)],
        preHandler: [addSessionHandler],
        handler: RestoreAccount,
    });

    fastify.route({
        method: "POST",
        url: "/accounts/setUserToAccount",
        preValidation: [AuthValidation("ACTUNIME", true)],
        preHandler: [addSessionHandler],
        handler: SetUserToAccount,
    });
}