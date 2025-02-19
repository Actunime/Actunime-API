import { FastifyInstance } from "fastify";
import { AuthValidation } from "../../_lib/auth";
import { UpdateChangesRouter } from "./_update";
import { addSessionHandler } from "../../_utils/_mongooseSession";
import { AcceptChangesRouter } from "./_accept";
import { DenyChangesRouter } from "./_deny";
import { DeleteChangesRouter } from "./_delete";

export async function Updates_Routes_V1(fastify: FastifyInstance) {
  fastify.route({
    method: "POST",
    url: "/patchs/update",
    preValidation: AuthValidation(["MODERATOR"]),
    preHandler: [addSessionHandler],
    handler: UpdateChangesRouter,
  });

  fastify.route({
    method: "POST",
    url: "/patchs/accept",
    preValidation: AuthValidation(["MODERATOR"]),
    preHandler: [addSessionHandler],
    handler: AcceptChangesRouter,
  });

  fastify.route({
    method: "POST",
    url: "/patchs/deny",
    preValidation: AuthValidation(["MODERATOR"]),
    preHandler: [addSessionHandler],
    handler: DenyChangesRouter,
  });

  fastify.route({
    method: "POST",
    url: "/patchs/delete",
    preValidation: AuthValidation(["MODERATOR"]),
    preHandler: [addSessionHandler],
    handler: DeleteChangesRouter,
  });
}
