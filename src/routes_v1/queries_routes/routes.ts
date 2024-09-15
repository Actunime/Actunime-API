import { FastifyInstance } from 'fastify';
import { FilterAnimeRouter, GetAnimeRouter } from './_anime.query';
import { FilterCharacterRouter, GetCharacterRouter } from './_character.query';
import { FilterCompanyRouter, GetCompanyRouter } from './_company.query';
import { FilterGroupeRouter, GetGroupeRouter } from './_groupe.query';
import { FilterPersonRouter, GetPersonRouter } from './_person.query';
import { FilterTrackRouter, GetTrackRouter } from './_track.query';
import { FilterUserRouter, GetUserRouter } from './_user.query';
import { FilterPatchRouter, GetPatchRouter } from './_patch.query';
import { AuthValidation } from '@/_utils/authUtil';
import { FilterActivityRouter, GetActivityRouter } from './_activity.query';
import { GetReportRouter, FilterReportRouter } from './_report.query';
import { GetStatsByPathRouter, GetStatsRouter } from './_stats.query';
import { FilterImageRouter, GetImageRouter } from './_image.query';
import { GetDefaultRouter } from './_default.query';

export async function Gets_Routes_V1(fastify: FastifyInstance) {
  // defaults
  fastify.route({
    method: 'GET',
    url: '/defaults',
    handler: GetDefaultRouter
  });

  // Images get/filter
  fastify.route({
    method: 'GET',
    url: '/images/:id',
    // preValidation: AuthValidation(['MODERATOR']),
    handler: GetImageRouter
  });
  fastify.route({
    method: 'GET',
    url: '/images',
    // preValidation: AuthValidation(['MODERATOR']),
    handler: FilterImageRouter
  });

  // Userrs get/filter
  fastify.route({
    method: 'GET',
    url: '/users/:id',
    // preValidation: AuthValidation(['MODERATOR']),
    handler: GetUserRouter
  });
  fastify.route({
    method: 'GET',
    url: '/users',
    // preValidation: AuthValidation(['MODERATOR']),
    handler: FilterUserRouter
  });

  // Patchs get/filter
  fastify.route({
    method: 'GET',
    url: '/updates/:id',
    preValidation: AuthValidation(['MODERATOR']),
    handler: GetPatchRouter
  });
  fastify.route({
    method: 'GET',
    url: '/updates',
    preValidation: AuthValidation(['MODERATOR']),
    handler: FilterPatchRouter
  });

  // Activitys get/filter
  fastify.route({
    method: 'GET',
    url: '/activitys/:id',
    preValidation: AuthValidation(['MODERATOR']),
    handler: GetActivityRouter
  });
  fastify.route({
    method: 'GET',
    url: '/activitys',
    preValidation: AuthValidation(['MODERATOR']),
    handler: FilterActivityRouter
  });

  // Reports get/filter
  fastify.route({
    method: 'GET',
    url: '/reports/:id',
    preValidation: AuthValidation(['MODERATOR']),
    handler: GetReportRouter
  });
  fastify.route({
    method: 'GET',
    url: '/reports',
    preValidation: AuthValidation(['MODERATOR']),
    handler: FilterReportRouter
  });

  // Animes get/filter
  fastify.route({
    method: 'GET',
    url: '/animes/:id',
    // preValidation: AuthValidation(['MODERATOR']),
    handler: GetAnimeRouter
  });
  fastify.route({
    method: 'GET',
    url: '/animes',
    // preValidation: AuthValidation(['MODERATOR']),
    handler: FilterAnimeRouter
  });

  // Characters get/filter
  fastify.route({
    method: 'GET',
    url: '/characters/:id',
    // preValidation: AuthValidation(['MODERATOR']),
    handler: GetCharacterRouter
  });
  fastify.route({
    method: 'GET',
    url: '/characters',
    // preValidation: AuthValidation(['MODERATOR']),
    handler: FilterCharacterRouter
  });

  // Companies get/filter
  fastify.route({
    method: 'GET',
    url: '/companys/:id',
    // preValidation: AuthValidation(['MODERATOR']),
    handler: GetCompanyRouter
  });
  fastify.route({
    method: 'GET',
    url: '/companys',
    // preValidation: AuthValidation(['MODERATOR']),
    handler: FilterCompanyRouter
  });

  // Groups get/filter
  fastify.route({
    method: 'GET',
    url: '/groupes/:id',
    // preValidation: AuthValidation(['MODERATOR']),
    handler: GetGroupeRouter
  });
  fastify.route({
    method: 'GET',
    url: '/groupes',
    // preValidation: AuthValidation(['MODERATOR']),
    handler: FilterGroupeRouter
  });

  // Persons get/filter
  fastify.route({
    method: 'GET',
    url: '/persons/:id',
    // preValidation: AuthValidation(['MODERATOR']),
    handler: GetPersonRouter
  });
  fastify.route({
    method: 'GET',
    url: '/persons',
    // preValidation: AuthValidation(['MODERATOR']),
    handler: FilterPersonRouter
  });

  // Tracks get/filter
  fastify.route({
    method: 'GET',
    url: '/tracks/:id',
    // preValidation: AuthValidation(['MODERATOR']),
    handler: GetTrackRouter
  });
  fastify.route({
    method: 'GET',
    url: '/tracks',
    // preValidation: AuthValidation(['MODERATOR']),
    handler: FilterTrackRouter
  });

  // Stats get
  fastify.route({
    method: 'GET',
    url: '/mediaStats',
    // preValidation: AuthValidation(['MODERATOR']),
    handler: GetStatsRouter
  });
  fastify.route({
    method: 'GET',
    url: '/mediaStats/:path',
    // preValidation: AuthValidation(['MODERATOR']),
    handler: GetStatsByPathRouter
  });
}
