import { FastifyInstance } from 'fastify';
import { Filter } from './_filter';
import { Get } from './_get';
import { Create } from './_create';
import { Update } from './_update';
import { AuthValidation } from '../../../_utils/authUtil';

export async function Animes_V1(fastify: FastifyInstance) {
  fastify.route({
    method: 'GET',
    url: '/animes',

    handler: Filter
  });
  fastify.route({
    method: 'GET',
    url: '/animes/:id',
    handler: Get
  });
  fastify.route({
    method: 'POST',
    url: '/animes/create',
    preValidation: AuthValidation(['MODERATOR']),
    handler: Create
  });
  fastify.route({
    method: 'POST',
    url: '/animes/:id/update',
    preValidation: AuthValidation(['MODERATOR']),
    handler: Update
  });
}
