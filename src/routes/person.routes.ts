import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { Utilchema } from '../schema/util.schema';
import {
  PersonCreateBody,
  PersonPaginationBody,
  MediaDeleteBody,
  MediaVerifyBody,
} from '@actunime/validations';
import { PersonHandlers } from '../handlers/person.handlers';
import { addSessionHandler } from '../_utils';
import { AddLogSession } from '../_utils/_logSession';
import { APIError } from '../_lib/error';

async function PersonRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  const tags = ['Person'];
  const handler = fastify.isTesting ? PersonHandlers : PersonHandlers;
  /** GET */

  app.route({
    method: 'GET',
    url: '/:id',
    schema: {
      description: "Récupération d'une personne",
      tags,
      params: Utilchema.IdParam,
      response: {
        200: Utilchema.ResponseBody(),
      },
    },
    handler: handler.getPerson,
  });

  app.route({
    method: 'GET',
    url: '/:id/stats',
    schema: {
      description: "Récupération des statistiques d'une personne",
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
      description: 'Filtrer les personnes',
      tags,
      body: PersonPaginationBody.strict().partial(),
      response: {
        200: Utilchema.ResponseBody(),
      },
    },
    handler: handler.filterPerson,
  });

  app.route({
    method: 'POST',
    url: '/create',
    schema: {
      description: 'Crée une personne',
      tags,
      body: PersonCreateBody.strict(),
      response: {
        200: Utilchema.ResponseBody(),
      },
    },
    preValidation: [fastify.authorize(['PERSON_CREATE'])],
    preHandler: [addSessionHandler, AddLogSession],
    handler: handler.createPerson,
  });

  app.route({
    method: 'POST',
    url: '/:id/update',
    schema: {
      description: 'Mettre a jour une personne',
      tags,
      body: PersonCreateBody.strict(),
      response: {
        200: Utilchema.ResponseBody(),
      },
    },
    preValidation: [fastify.authorize(['PERSON_PATCH'])],
    preHandler: [addSessionHandler, AddLogSession],
    handler: handler.updatePerson,
  });

  app.route({
    method: 'POST',
    url: '/:id/delete',
    schema: {
      description: 'Supprimer une personne',
      tags,
      body: MediaDeleteBody.strict().partial({ reccursive: true }),
      response: {
        200: Utilchema.ResponseBody(),
      },
    },
    preValidation: [fastify.authorize(['PERSON_DELETE'])],
    preHandler: [addSessionHandler, AddLogSession],
    handler: handler.deletePerson,
  });

  app.route({
    method: 'POST',
    url: '/:id/verify',
    schema: {
      description: 'Vérifier une personne',
      tags,
      body: MediaVerifyBody.strict().partial(),
      response: {
        200: Utilchema.ResponseBody(),
      },
    },
    preValidation: [fastify.authorize(['PERSON_VERIFY'])],
    preHandler: [addSessionHandler, AddLogSession],
    handler: handler.verifyPerson,
  });

  app.route({
    method: 'POST',
    url: '/:id/unverify',
    schema: {
      description: 'Dévérifier une personne',
      tags,
      body: MediaVerifyBody,
      response: {
        200: Utilchema.ResponseBody(),
      },
    },
    preValidation: [fastify.authorize(['PERSON_VERIFY'])],
    preHandler: [addSessionHandler, AddLogSession],
    handler: handler.unverifyPerson,
  });

  app.route({
    method: 'POST',
    url: '/requests/create',
    schema: {
      description: "Créer une [demande] [création] d'une personne",
      tags,
      body: PersonCreateBody,
      response: {
        200: Utilchema.ResponseBody(),
      },
    },
    preValidation: [fastify.authorize(['PERSON_CREATE_REQUEST'])],
    preHandler: [addSessionHandler, AddLogSession],
    handler: handler.createPersonRequest,
  });

  app.route({
    method: 'POST',
    url: '/:id/requests',
    schema: {
      description: "Filtrer les demandes d'une personne",
      tags,
      response: {
        200: Utilchema.ResponseBody(),
      },
    },
    preValidation: [fastify.authorize([])],
    preHandler: [AddLogSession],
    handler: handler.filterPersonRequestByPersonID,
  });

  app.route({
    method: 'POST',
    // create au lieu de update semble plus logique;
    url: '/:id/requests/create',
    schema: {
      description: "Créer une [demande] de [modification] d'une personne",
      tags,
      body: PersonCreateBody,
      response: {
        200: Utilchema.ResponseBody(),
      },
    },
    preValidation: [fastify.authorize(['PERSON_PATCH_REQUEST'])],
    preHandler: [addSessionHandler, AddLogSession],
    handler: handler.updatePersonRequest,
  });

  app.route({
    method: 'POST',
    url: '/:personID/requests/:patchID/update',
    schema: {
      description: "Mettre a jour la demande d'une personne",
      tags,
      body: PersonCreateBody,
      response: {
        200: Utilchema.ResponseBody(),
      },
    },
    preValidation: [fastify.authorize(['PERSON_REQUEST_PATCH'])],
    preHandler: [addSessionHandler, AddLogSession],
    handler: PersonHandlers.updatePersonPatch,
  });

  app.route({
    method: 'POST',
    url: '/:personID/requests/:patchID/accept',
    schema: {
      description: "Accepter la demande d'une personne",
      tags,
      body: MediaVerifyBody.strict().partial(),
      response: {
        200: Utilchema.ResponseBody(),
      },
    },
    preValidation: [fastify.authorize(['PERSON_REQUEST_VERIFY'])],
    preHandler: [addSessionHandler, AddLogSession],
    handler: handler.acceptPersonPatch,
  });

  app.route({
    method: 'POST',
    url: '/:personID/requests/:patchID/reject',
    schema: {
      description: "Refuser la demande d'une personne",
      tags,
      body: MediaVerifyBody.strict().partial({ reccursive: true }),
      response: {
        200: Utilchema.ResponseBody(),
      },
    },
    preValidation: [fastify.authorize(['PERSON_REQUEST_VERIFY'])],
    preHandler: [addSessionHandler, AddLogSession],
    handler: handler.rejectPersonPatch,
  });

  app.route({
    method: 'POST',
    url: '/:personID/requests/:patchID/delete',
    schema: {
      description: "Supprimer la demande d'une personne",
      tags,
      body: MediaVerifyBody.strict().partial({ reccursive: true }),
      response: {
        200: Utilchema.ResponseBody(),
      },
    },
    preValidation: [fastify.authorize(['PERSON_REQUEST_DELETE'])],
    preHandler: [addSessionHandler, AddLogSession],
    handler: handler.deletePersonPatch,
  });
}

export default PersonRoutes;
