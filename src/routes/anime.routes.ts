import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { Utilchema } from '../schema/util.schema';
import {
  AnimeCreateBody,
  AnimePaginationBody,
  MediaDeleteBody,
  MediaVerifyBody,
  PatchPaginationBody,
} from '@actunime/validations';
import { AnimeHandlers } from '../handlers/anime.handlers';
import { addSessionHandler } from '../_utils';
import { AddLogSession } from '../_utils/_logSession';
import { APIError } from '../_lib/error';

async function AnimeRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  const tags = ['Anime'];
  const handler = fastify.isTesting ? AnimeHandlers : AnimeHandlers;
  /** GET */

  app.route({
    method: 'GET',
    url: '/:id',
    schema: {
      description: "Récupération d'un anime",
      tags,
      params: Utilchema.IdParam,
      response: {
        200: Utilchema.ResponseBody(),
      },
    },
    handler: handler.getAnime,
  });

  app.route({
    method: 'GET',
    url: '/:id/stats',
    schema: {
      description: "Récupération des statistiques d'un anime",
      tags,
      response: {
        200: Utilchema.ResponseBody(),
        401: Utilchema.UnauthorizedResponseBody(),
      },
    },
    handler: () => {
      throw new APIError(
        "Cette route n'est pas encore disponible",
        'NOT_FOUND'
      );
    },
  });

  /** POST */

  app.route({
    method: 'POST',
    url: '/',
    schema: {
      description: 'Filtrer les animes',
      tags,
      body: AnimePaginationBody.strict().partial(),
      response: {
        200: Utilchema.ResponseBody(),
      },
    },
    handler: handler.filterAnime,
  });

  app.route({
    method: 'POST',
    url: '/create',
    schema: {
      description: 'Crée un anime',
      tags,
      body: AnimeCreateBody.strict(),
      response: {
        200: Utilchema.ResponseBody(),
      },
    },
    preValidation: [fastify.authorize(['ANIME_CREATE'])],
    preHandler: [addSessionHandler, AddLogSession],
    handler: handler.createAnime,
  });

  app.route({
    method: 'POST',
    url: '/:id/update',
    schema: {
      description: 'Mettre a jour un anime',
      tags,
      body: AnimeCreateBody.strict(),
      response: {
        200: Utilchema.ResponseBody(),
      },
    },
    preValidation: [fastify.authorize(['ANIME_PATCH'])],
    preHandler: [addSessionHandler, AddLogSession],
    handler: handler.updateAnime,
  });

  app.route({
    method: 'POST',
    url: '/:id/delete',
    schema: {
      description: 'Supprimer un anime',
      tags,
      body: MediaDeleteBody.strict().partial({ reccursive: true }),
      response: {
        200: Utilchema.ResponseBody(),
      },
    },
    preValidation: [fastify.authorize(['ANIME_DELETE'])],
    preHandler: [addSessionHandler, AddLogSession],
    handler: handler.deleteAnime,
  });

  app.route({
    method: 'POST',
    url: '/:id/verify',
    schema: {
      description: 'Vérifier un anime',
      tags,
      body: MediaVerifyBody.strict().partial(),
      response: {
        200: Utilchema.ResponseBody(),
      },
    },
    preValidation: [fastify.authorize(['ANIME_VERIFY'])],
    preHandler: [addSessionHandler, AddLogSession],
    handler: handler.verifyAnime,
  });

  app.route({
    method: 'POST',
    url: '/:id/unverify',
    schema: {
      description: 'Dévérifier un anime',
      tags,
      body: MediaVerifyBody.strict().partial(),
      response: {
        200: Utilchema.ResponseBody(),
      },
    },
    preValidation: [fastify.authorize(['ANIME_VERIFY'])],
    preHandler: [addSessionHandler, AddLogSession],
    handler: handler.unverifyAnime,
  });

  app.route({
    method: 'POST',
    url: '/requests/create',
    schema: {
      description: "Créer une [demande] [création] d'un anime",
      tags,
      body: AnimeCreateBody.strict().partial(),
      response: {
        200: Utilchema.ResponseBody(),
      },
    },
    preValidation: [fastify.authorize(['ANIME_CREATE_REQUEST'])],
    preHandler: [addSessionHandler, AddLogSession],
    handler: handler.createAnimeRequest,
  });

  app.route({
    method: 'POST',
    url: '/:id/requests',
    schema: {
      description: "Filtrer les demandes d'un anime",
      tags,
      body: PatchPaginationBody.strict().partial(),
      response: {
        200: Utilchema.ResponseBody(),
      },
    },
    preValidation: [fastify.authorize([])],
    preHandler: [AddLogSession],
    handler: handler.filterAnimeRequestByAnimeID,
  });

  app.route({
    method: 'POST',
    // create au lieu de update semble plus logique;
    url: '/:id/requests/create',
    schema: {
      description: "Créer une [demande] de [modification] d'un anime",
      tags,
      body: AnimeCreateBody.strict().partial(),
      response: {
        200: Utilchema.ResponseBody(),
      },
    },
    preValidation: [fastify.authorize(['ANIME_PATCH_REQUEST'])],
    preHandler: [addSessionHandler, AddLogSession],
    handler: handler.updateAnimeRequest,
  });

  app.route({
    method: 'POST',
    url: '/:animeID/requests/:patchID/update',
    schema: {
      description: "Mettre a jour la demande d'un anime",
      tags,
      body: AnimeCreateBody.strict().partial(),
      response: {
        200: Utilchema.ResponseBody(),
      },
    },
    preValidation: [fastify.authorize(['ANIME_REQUEST_PATCH'])],
    preHandler: [addSessionHandler, AddLogSession],
    handler: AnimeHandlers.updateAnimePatch,
  });

  app.route({
    method: 'POST',
    url: '/:animeID/requests/:patchID/accept',
    schema: {
      description: "Accepter la demande d'un anime",
      tags,
      body: MediaVerifyBody.strict().partial(),
      response: {
        200: Utilchema.ResponseBody(),
      },
    },
    preValidation: [fastify.authorize(['ANIME_REQUEST_VERIFY'])],
    preHandler: [addSessionHandler, AddLogSession],
    handler: handler.acceptAnimePatch,
  });

  app.route({
    method: 'POST',
    url: '/:animeID/requests/:patchID/reject',
    schema: {
      description: "Refuser la demande d'un anime",
      tags,
      body: MediaVerifyBody.strict().partial({ reccursive: true }),
      response: {
        200: Utilchema.ResponseBody(),
      },
    },
    preValidation: [fastify.authorize(['ANIME_REQUEST_VERIFY'])],
    preHandler: [addSessionHandler, AddLogSession],
    handler: handler.rejectAnimePatch,
  });
}

export default AnimeRoutes;
