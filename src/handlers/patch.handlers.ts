import { FastifyRequest, RouteHandler } from 'fastify';
import { z } from 'zod';
import { PatchController } from '../controllers/patch.controllers';
import { APIResponse } from '../_utils/_response';
import { PatchPaginationBody } from '@actunime/validations';
import { Patch } from '../_lib/media';

const getPatchById: RouteHandler = async (req) => {
  const { id } = z.object({ id: z.string() }).parse(req.params);
  const res = await Patch.get(id, { nullThrowErr: true });
  return new APIResponse({ success: true, data: res });
};

const filterPatch = async (
  req: FastifyRequest<{ Body: z.infer<typeof PatchPaginationBody> }>
) => {
  const Patchs = await new PatchController(req.mongooseSession, {
    log: req.logSession,
  }).pagination(req.body);
  return new APIResponse({ success: true, data: Patchs });
};

export const PatchHandlers = {
  getPatchById,
  filterPatch,
};
