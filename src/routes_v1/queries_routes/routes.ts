import { FastifyInstance } from 'fastify';
import { FilterAnimeRouter, GetAnimeRouter } from './_anime.query';
import { FilterCharacterRouter, GetCharacterRouter } from './_character.query';
import { FilterCompanyRouter, GetCompanyRouter } from './_company.query';
import { FilterGroupeRouter, GetGroupeRouter } from './_groupe.query';
import { FilterPersonRouter, GetPersonRouter } from './_person.query';
import { FilterTrackRouter, GetTrackRouter } from './_track.query';
import { FilterUserRouter, GetUserRouter } from './_user.query';

export async function Gets_Routes_V1(fastify: FastifyInstance) {
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
    url: '/groups/:id',
    // preValidation: AuthValidation(['MODERATOR']),
    handler: GetGroupeRouter
  });
  fastify.route({
    method: 'GET',
    url: '/groups',
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
}
