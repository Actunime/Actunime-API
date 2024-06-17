import { FastifyInstance } from 'fastify';
import { Filter } from './_filter';
import { AuthValidation } from '../../../_utils/authUtil';

export async function Activitys_V1(fastify: FastifyInstance) {
  fastify.route({
    method: 'GET',
    url: '/activitys',
    preValidation: AuthValidation(['MODERATOR']),
    handler: Filter
  });
}
