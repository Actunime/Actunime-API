import { FastifyInstance } from "fastify";
import { Users_Routes_V1 } from "./users/routes";
import { Accounts_Routes_V1 } from "./accounts/routes";

export async function Database_Routes_V1(fastify: FastifyInstance) {
    await fastify.register(Users_Routes_V1, { prefix: '/database' });
    await fastify.register(Accounts_Routes_V1, { prefix: '/database' });
}