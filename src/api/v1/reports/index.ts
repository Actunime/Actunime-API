import { FastifyInstance } from 'fastify';
import { Filter } from './_filter';
import { AuthValidation } from '../../../_utils/authUtil';
// import { Get } from "./_get";
// import { Create } from "./_create";
// import { Update } from "./_update";

export async function Reports_V1(fastify: FastifyInstance) {
  fastify.route({
    method: 'GET',
    url: '/reports',
    preValidation: AuthValidation(['MODERATOR']),
    handler: Filter
  });
  // fastify.route({
  //     method: "GET",
  //     url: "/reports/:id",
  //     handler: Get
  // })
  // fastify.route({
  //     method: "POST",
  //     url: "/reports/create",
  //     handler: Create
  // })
  // fastify.route({
  //     method: "POST",
  //     url: "/reports/:id",
  //     handler: Update
  // })
}
