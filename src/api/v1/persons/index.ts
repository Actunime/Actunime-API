import { FastifyInstance } from 'fastify';
import { Filter } from './_filter';
import { Get } from './_get';
// import { Create } from "./_create";
import { Update } from './_update';
import { AuthValidation } from '../../../_utils/authUtil';
import { Create } from './_create';

export async function Persons_V1(fastify: FastifyInstance) {
  fastify.route({
    method: 'GET',
    url: '/persons',
    handler: Filter
  });
  fastify.route({
    method: 'GET',
    url: '/persons/:id',
    handler: Get
  });
  fastify.route({
    method: 'POST',
    url: '/persons/create',
    preValidation: AuthValidation(['MODERATOR']),
    handler: Create
  });
  fastify.route({
    method: 'POST',
    url: '/persons/:id/update',
    preValidation: AuthValidation(['MODERATOR']),
    handler: Update
  });
}
