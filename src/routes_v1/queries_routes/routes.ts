import { FastifyInstance } from "fastify";
import { FilterAnimeRouter, GetAnimeRouter } from "./_anime.query";
import { FilterCharacterRouter, GetCharacterRouter } from "./_character.query";
import { FilterCompanyRouter, GetCompanyRouter } from "./_company.query";
import { FilterGroupeRouter, GetGroupeRouter } from "./_groupe.query";
import { FilterPersonRouter, GetPersonRouter } from "./_person.query";
import { FilterTrackRouter, GetTrackRouter } from "./_track.query";
import { FilterUserRouter, GetUserRouter } from "./_user.query";
import { FilterPatchRouter, GetPatchRouter } from "./_patch.query";
import { AuthValidation } from "../../_lib/auth";
import { FilterActivityRouter, GetActivityRouter } from "./_activity.query";
import { GetReportRouter, FilterReportRouter } from "./_report.query";
import { GetStatsByPathRouter, GetStatsRouter } from "./_stats.query";
import { FilterImageRouter, GetImageRouter } from "./_image.query";
import { GetDefaultRouter } from "./_default.query";
import { addSessionHandler } from "../../_utils/_mongooseSession";

export async function Gets_Routes_V1(fastify: FastifyInstance) {
  // defaults
  fastify.route({
    method: "GET",
    url: "/defaults",
    handler: GetDefaultRouter,
  });

  // Images get/filter
  fastify.route({
    method: "GET",
    url: "/images/:id",
    preValidation: AuthValidation([], true, false),
    preHandler: [addSessionHandler],
    handler: GetImageRouter,
  });
  fastify.route({
    method: "GET",
    url: "/images",
    preValidation: AuthValidation([], true, false),
    handler: FilterImageRouter,
  });

  // Userrs get/filter
  fastify.route({
    method: "GET",
    url: "/users/:id",
    preValidation: AuthValidation([], true, false),
    handler: GetUserRouter,
  });
  fastify.route({
    method: "GET",
    url: "/users",
    preValidation: AuthValidation([], true, false),
    handler: FilterUserRouter,
  });

  // Patchs get/filter
  fastify.route({
    method: "GET",
    url: "/patchs/:id",
    preValidation: AuthValidation(["MODERATOR"]),
    handler: GetPatchRouter,
  });
  fastify.route({
    method: "GET",
    url: "/patchs",
    preValidation: AuthValidation(["MODERATOR"]),
    handler: FilterPatchRouter,
  });

  // Activitys get/filter
  fastify.route({
    method: "GET",
    url: "/activitys/:id",
    preValidation: AuthValidation(["MODERATOR"]),
    handler: GetActivityRouter,
  });
  fastify.route({
    method: "GET",
    url: "/activitys",
    preValidation: AuthValidation(["MODERATOR"]),
    handler: FilterActivityRouter,
  });

  // Reports get/filter
  fastify.route({
    method: "GET",
    url: "/reports/:id",
    preValidation: AuthValidation(["MODERATOR"]),
    handler: GetReportRouter,
  });
  fastify.route({
    method: "GET",
    url: "/reports",
    preValidation: AuthValidation(["MODERATOR"]),
    handler: FilterReportRouter,
  });

  // Animes get/filter
  fastify.route({
    method: "GET",
    url: "/animes/:id",
    preValidation: AuthValidation([], true, false),
    handler: GetAnimeRouter,
  });
  fastify.route({
    method: "GET",
    url: "/animes",
    preValidation: AuthValidation([], true, false),
    handler: FilterAnimeRouter,
  });

  // Characters get/filter
  fastify.route({
    method: "GET",
    url: "/characters/:id",
    preValidation: AuthValidation([], true, false),
    handler: GetCharacterRouter,
  });
  fastify.route({
    method: "GET",
    url: "/characters",
    preValidation: AuthValidation([], true, false),
    handler: FilterCharacterRouter,
  });

  // Companies get/filter
  fastify.route({
    method: "GET",
    url: "/companys/:id",
    preValidation: AuthValidation([], true, false),
    handler: GetCompanyRouter,
  });
  fastify.route({
    method: "GET",
    url: "/companys",
    preValidation: AuthValidation([], true, false),
    handler: FilterCompanyRouter,
  });

  // Groups get/filter
  fastify.route({
    method: "GET",
    url: "/groupes/:id",
    preValidation: AuthValidation([], true, false),
    handler: GetGroupeRouter,
  });
  fastify.route({
    method: "GET",
    url: "/groupes",
    preValidation: AuthValidation([], true, false),
    handler: FilterGroupeRouter,
  });

  // Persons get/filter
  fastify.route({
    method: "GET",
    url: "/persons/:id",
    preValidation: AuthValidation([], true, false),
    handler: GetPersonRouter,
  });
  fastify.route({
    method: "GET",
    url: "/persons",
    preValidation: AuthValidation([], true, false),
    handler: FilterPersonRouter,
  });

  // Tracks get/filter
  fastify.route({
    method: "GET",
    url: "/tracks/:id",
    preValidation: AuthValidation([], true, false),
    handler: GetTrackRouter,
  });
  fastify.route({
    method: "GET",
    url: "/tracks",
    preValidation: AuthValidation([], true, false),
    handler: FilterTrackRouter,
  });

  // Stats get
  fastify.route({
    method: "GET",
    url: "/mediaStats",
    preValidation: AuthValidation([], true, false),
    handler: GetStatsRouter,
  });
  fastify.route({
    method: "GET",
    url: "/mediaStats/:path",
    preValidation: AuthValidation([], true, false),
    handler: GetStatsByPathRouter,
  });
}
