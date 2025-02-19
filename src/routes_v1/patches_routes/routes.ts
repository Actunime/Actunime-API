import { FastifyInstance } from "fastify";
import { AuthValidation } from "../../_lib/auth";
import { PatchAnimeRouter, RequestPatchAnimeRouter } from "./_anime.patch";
import {
  PatchCharacterRouter,
  RequestPatchCharacterRouter,
} from "./_character.patch";
import {
  PatchCompanyRouter,
  RequestPatchCompanyRouter,
} from "./_company.patch";
import { PatchGroupeRouter, RequestPatchGroupeRouter } from "./_groupe.patch";
import { PatchPersonRouter, RequestPatchPersonRouter } from "./_person.patch";
import { PatchTrackRouter, RequestPatchTrackRouter } from "./_track.patch";
import { PatchReportRouter } from "./_report.patch";
import { PatchUserRouter } from "./_user.patch";
import { addSessionHandler } from "../../_utils/_mongooseSession";

export async function Patchs_Routes_V1(fastify: FastifyInstance) {
  // Patch User
  fastify.route({
    method: "POST",
    url: "/users/patch/:id",
    preValidation: AuthValidation(["MODERATOR"]),
    preHandler: [addSessionHandler],
    handler: PatchUserRouter,
  });

  // Patch/Request Anime
  fastify.route({
    method: "POST",
    url: "/animes/patch/:id",
    preValidation: AuthValidation(["MODERATOR"]),
    preHandler: [addSessionHandler],
    handler: PatchAnimeRouter,
  });
  fastify.route({
    method: "POST",
    url: "/animes/patch/request/:id",
    preValidation: AuthValidation(["MODERATOR"]),
    preHandler: [addSessionHandler],
    handler: RequestPatchAnimeRouter,
  });

  // Patch/Request Character
  fastify.route({
    method: "POST",
    url: "/characters/patch/:id",
    preValidation: AuthValidation(["MODERATOR"]),
    preHandler: [addSessionHandler],
    handler: PatchCharacterRouter,
  });
  fastify.route({
    method: "POST",
    url: "/characters/patch/request/:id",
    preValidation: AuthValidation(["MODERATOR"]),
    preHandler: [addSessionHandler],
    handler: RequestPatchCharacterRouter,
  });

  // Patch/Request Company
  fastify.route({
    method: "POST",
    url: "/companys/patch/:id",
    preValidation: AuthValidation(["MODERATOR"]),
    preHandler: [addSessionHandler],
    handler: PatchCompanyRouter,
  });
  fastify.route({
    method: "POST",
    url: "/companys/patch/request/:id",
    preValidation: AuthValidation(["MODERATOR"]),
    preHandler: [addSessionHandler],
    handler: RequestPatchCompanyRouter,
  });

  // Patch/Request Groupe
  fastify.route({
    method: "POST",
    url: "/groups/patch/:id",
    preValidation: AuthValidation(["MODERATOR"]),
    preHandler: [addSessionHandler],
    handler: PatchGroupeRouter,
  });
  fastify.route({
    method: "POST",
    url: "/groups/patch/request/:id",
    preValidation: AuthValidation(["MODERATOR"]),
    preHandler: [addSessionHandler],
    handler: RequestPatchGroupeRouter,
  });

  // Patch/Request Person
  fastify.route({
    method: "POST",
    url: "/persons/patch/:id",
    preValidation: AuthValidation(["MODERATOR"]),
    preHandler: [addSessionHandler],
    handler: PatchPersonRouter,
  });
  fastify.route({
    method: "POST",
    url: "/persons/patch/request/:id",
    preValidation: AuthValidation(["MODERATOR"]),
    preHandler: [addSessionHandler],
    handler: RequestPatchPersonRouter,
  });

  // Patch/Request Track
  fastify.route({
    method: "POST",
    url: "/tracks/patch/:id",
    preValidation: AuthValidation(["MODERATOR"]),
    preHandler: [addSessionHandler],
    handler: PatchTrackRouter,
  });
  fastify.route({
    method: "POST",
    url: "/tracks/patch/request/:id",
    preValidation: AuthValidation(["MODERATOR"]),
    preHandler: [addSessionHandler],
    handler: RequestPatchTrackRouter,
  });

  // Patch Report
  fastify.route({
    method: "POST",
    url: "/reports/patch/:id",
    preValidation: AuthValidation(["MODERATOR"]),
    preHandler: [addSessionHandler],
    handler: PatchReportRouter,
  });
}
