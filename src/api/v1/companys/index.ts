import { FastifyInstance } from 'fastify';
import { Filter } from './_filter';
import { Get } from './_get';
// import { Create } from "./_create";
import { Update } from './_update';
import { AuthValidation } from '../../../_utils/authUtil';

export async function Companys_V1(fastify: FastifyInstance) {
  fastify.route({
    method: 'GET',
    url: '/companys',
    handler: Filter
  });
  fastify.route({
    method: 'GET',
    url: '/companys/:id',
    handler: Get
  });
  // fastify.route({
  //     method: "POST",
  //     url: "/companys/create",
  //     handler: Create
  // })
  fastify.route({
    method: 'POST',
    url: '/companys/:id/update',
    preValidation: AuthValidation(['MODERATOR']),
    handler: Update
  });
}
