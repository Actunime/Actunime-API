import { FastifyInstance } from 'fastify';
import { GetPath } from './_getPath';
import { Get } from './_get';

export async function MediaStats_V1(fastify: FastifyInstance) {
  fastify.route({
    method: 'GET',
    url: '/mediaStats',
    handler: Get
  });
  fastify.route({
    method: 'GET',
    url: '/mediaStats/:path',
    handler: GetPath
  });
}
