import { FastifyInstance } from 'fastify';
import { AuthValidation } from '@/_utils/authUtil';
import { CreateUserRouter } from './_inscription';

export async function Clients_Routes_V1(fastify: FastifyInstance) {
  fastify.route({
    method: 'POST',
    url: '/clients/inscripton/create',
    preValidation: AuthValidation(['ACTUNIME']),
    handler: CreateUserRouter
  });
}
