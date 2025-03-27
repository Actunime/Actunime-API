import { FastifyInstance, FastifyRequest } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { Utilchema } from '../schema/util.schema';
import { PatchHandlers } from '../handlers/patch.handlers';
import { MediaVerifyBody, PatchPaginationBody } from '@actunime/validations';
import { addSessionHandler } from '../_utils';
import { AddLogSession } from '../_utils/_logSession';
import { PermissionsArray } from '@actunime/types';
import { APIError } from '../_lib/error';

function PatchRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  const tags = ['Patch'];
  app.route({
    method: 'POST',
    url: '/',
    schema: {
      description: '',
      tags,
      body: PatchPaginationBody.partial().strict(),
      response: {
        200: Utilchema.ResponseBody(),
      },
    },
    handler: PatchHandlers.filterPatch,
  });

  app.route({
    method: 'GET',
    url: '/:id/stats',
    schema: {
      description: '',
      tags,
      params: Utilchema.IdParam.strict(),
      response: {
        200: Utilchema.ResponseBody(),
      },
    },
    handler: () => {
      throw new APIError(
        "Cette route n'est pas encore disponible",
        'NOT_FOUND'
      );
    },
  });

  app.route({
    method: 'GET',
    url: '/:id',
    schema: {
      description: '',
      tags,
      params: Utilchema.IdParam.strict(),
      response: {
        200: Utilchema.ResponseBody(),
      },
    },
    handler: PatchHandlers.getPatchById,
  });

  // app.route({
  //   method: 'GET',
  //   url: '/:id/references',
  //   schema: {
  //     description: '',
  //     tags,
  //     params: Utilchema.IdParam.strict(),
  //     response: {
  //       200: Utilchema.ResponseBody(),
  //       401: Utilchema.UnauthorizedResponseBody(),
  //     },
  //   },
  //   handler: () => {},
  // });

  app.route({
    method: 'POST',
    url: '/:id/delete',
    schema: {
      description: 'Supprimer une demande',
      tags,
      params: Utilchema.IdParam.strict(),
      body: MediaVerifyBody.strict().partial({ reccursive: true }),
      response: {
        200: Utilchema.ResponseBody(),
      },
    },
    preValidation: [fastify.authorize(PermissionsArray.filter((p) => p.endsWith("REQUEST_DELETE")), false)],
    preHandler: [addSessionHandler, AddLogSession],
    handler: PatchHandlers.deletePatch,
  });
}

export default PatchRoutes;
