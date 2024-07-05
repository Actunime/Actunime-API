import { FastifyInstance } from 'fastify';
import { AuthValidation } from '@/_utils/authUtil';
import { PatchAnimeRouter, RequestPatchAnimeRouter } from './_anime.patch';
import { PatchCharacterRouter, RequestPatchCharacterRouter } from './_character.patch';
import { PatchCompanyRouter, RequestPatchCompanyRouter } from './_company.patch';
import { PatchGroupeRouter, RequestPatchGroupeRouter } from './_groupe.patch';
import { PatchPersonRouter, RequestPatchPersonRouter } from './_person.patch';
import { PatchTrackRouter, RequestPatchTrackRouter } from './_track.patch';

export async function Patchs_Routes_V1(fastify: FastifyInstance) {
  // Patch/Request Anime
  fastify.route({
    method: 'POST',
    url: '/animes/update/:id',
    preValidation: AuthValidation(['MODERATOR']),
    handler: PatchAnimeRouter
  });
  fastify.route({
    method: 'POST',
    url: '/animes/update/request/:id',
    preValidation: AuthValidation(['MODERATOR']),
    handler: RequestPatchAnimeRouter
  });

  // Patch/Request Character
  fastify.route({
    method: 'POST',
    url: '/characters/update/:id',
    preValidation: AuthValidation(['MODERATOR']),
    handler: PatchCharacterRouter
  });
  fastify.route({
    method: 'POST',
    url: '/characters/update/request/:id',
    preValidation: AuthValidation(['MODERATOR']),
    handler: RequestPatchCharacterRouter
  });

  // Patch/Request Company
  fastify.route({
    method: 'POST',
    url: '/companys/update/:id',
    preValidation: AuthValidation(['MODERATOR']),
    handler: PatchCompanyRouter
  });
  fastify.route({
    method: 'POST',
    url: '/companys/update/request/:id',
    preValidation: AuthValidation(['MODERATOR']),
    handler: RequestPatchCompanyRouter
  });

  // Patch/Request Groupe
  fastify.route({
    method: 'POST',
    url: '/groups/update/:id',
    preValidation: AuthValidation(['MODERATOR']),
    handler: PatchGroupeRouter
  });
  fastify.route({
    method: 'POST',
    url: '/groups/update/request/:id',
    preValidation: AuthValidation(['MODERATOR']),
    handler: RequestPatchGroupeRouter
  });

  // Patch/Request Person
  fastify.route({
    method: 'POST',
    url: '/persons/update/:id',
    preValidation: AuthValidation(['MODERATOR']),
    handler: PatchPersonRouter
  });
  fastify.route({
    method: 'POST',
    url: '/persons/update/request/:id',
    preValidation: AuthValidation(['MODERATOR']),
    handler: RequestPatchPersonRouter
  });

  // Patch/Request Track
  fastify.route({
    method: 'POST',
    url: '/tracks/update/:id',
    preValidation: AuthValidation(['MODERATOR']),
    handler: PatchTrackRouter
  });
  fastify.route({
    method: 'POST',
    url: '/tracks/update/request/:id',
    preValidation: AuthValidation(['MODERATOR']),
    handler: RequestPatchTrackRouter
  });
}
