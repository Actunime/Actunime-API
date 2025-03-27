import { FastifyInstance } from 'fastify';
import { UserHandlers } from '../handlers/user.handlers';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { UserClientCreateBody, UserCreateBody } from '@actunime/validations';
import { addSessionHandler } from '../_utils';
import { AddLogSession } from '../_utils/_logSession';

function UserRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.get(
    '/:id',
    {
      schema: {
        description: '',
        tags: ['User'],
      },
    },
    UserHandlers.getUserById
  );

  app.get(
    '/me',
    {
      schema: {
        description: '',
        tags: ['User'],
      },
    },
    UserHandlers.getCurrentUser
  );

  app.route({
    url: '/account/:id',
    method: 'GET',
    schema: {
      description: '',
      tags: ['User'],
    },
    preValidation: [fastify.authorize([])],
    handler: UserHandlers.getUserByAccountId,
  });

  app.route({
    method: 'POST',
    url: '/me/update',
    schema: {
      description: '',
      tags: ['User'],
      body: UserCreateBody,
    },
    preValidation: [fastify.authorize([])],
    preHandler: [addSessionHandler, AddLogSession],
    handler: UserHandlers.updateCurrentUser,
  });

  app.route({
    method: 'POST',
    url: '/client/create',
    schema: {
      description: '',
      tags: ['User'],
      body: UserClientCreateBody,
    },
    preValidation: [fastify.authorize(['USER_CREATE'])],
    preHandler: [addSessionHandler, AddLogSession],
    handler: UserHandlers.clientCreateUser,
  });

  app.route({
    method: 'POST',
    url: '/:id/update',
    schema: {
      description: '',
      tags: ['User'],
      body: UserCreateBody,
    },
    preValidation: [fastify.authorize(['USER_PATCH'])],
    preHandler: [addSessionHandler, AddLogSession],
    handler: UserHandlers.updateUser,
  });
}

export default UserRoutes;
