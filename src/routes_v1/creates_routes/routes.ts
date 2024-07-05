import { FastifyInstance } from 'fastify';
import { AuthValidation } from '@/_utils/authUtil';
import { CreateAnimeRouter, RequestCreateAnimeRouter } from './_anime.create';
import { CreateCharacterRouter, RequestCreateCharacterRouter } from './_character.create';
import { CreateCompanyRouter, RequestCreateCompanyRouter } from './_company.create';
import { CreateGroupeRouter, RequestCreateGroupeRouter } from './_groupe.create';
import { CreatePersonRouter, RequestCreatePersonRouter } from './_person.create';
import { CreateTrackRouter, RequestCreateTrackRouter } from './_track.create';

export async function Creates_Routes_V1(fastify: FastifyInstance) {
  // Create/Request Anime
  fastify.route({
    method: 'POST',
    url: '/animes/create',
    preValidation: AuthValidation(['MODERATOR']),
    handler: CreateAnimeRouter
  });
  fastify.route({
    method: 'POST',
    url: '/animes/create/request',
    preValidation: AuthValidation(['MODERATOR']),
    handler: RequestCreateAnimeRouter
  });

  // Create/Request Character
  fastify.route({
    method: 'POST',
    url: '/characters/create',
    preValidation: AuthValidation(['MODERATOR']),
    handler: CreateCharacterRouter
  });
  fastify.route({
    method: 'POST',
    url: '/characters/create/request',
    preValidation: AuthValidation(['MODERATOR']),
    handler: RequestCreateCharacterRouter
  });

  // Create/Request Company
  fastify.route({
    method: 'POST',
    url: '/companys/create',
    preValidation: AuthValidation(['MODERATOR']),
    handler: CreateCompanyRouter
  });
  fastify.route({
    method: 'POST',
    url: '/companys/create/request',
    preValidation: AuthValidation(['MODERATOR']),
    handler: RequestCreateCompanyRouter
  });

  // Create/Request Groupe
  fastify.route({
    method: 'POST',
    url: '/groups/create',
    preValidation: AuthValidation(['MODERATOR']),
    handler: CreateGroupeRouter
  });
  fastify.route({
    method: 'POST',
    url: '/groups/create/request',
    preValidation: AuthValidation(['MODERATOR']),
    handler: RequestCreateGroupeRouter
  });

  // Create/Request Person
  fastify.route({
    method: 'POST',
    url: '/persons/create',
    preValidation: AuthValidation(['MODERATOR']),
    handler: CreatePersonRouter
  });
  fastify.route({
    method: 'POST',
    url: '/persons/create/request',
    preValidation: AuthValidation(['MODERATOR']),
    handler: RequestCreatePersonRouter
  });

  // Create/Request Track
  fastify.route({
    method: 'POST',
    url: '/tracks/create',
    preValidation: AuthValidation(['MODERATOR']),
    handler: CreateTrackRouter
  });
  fastify.route({
    method: 'POST',
    url: '/tracks/create/request',
    preValidation: AuthValidation(['MODERATOR']),
    handler: RequestCreateTrackRouter
  });
}
