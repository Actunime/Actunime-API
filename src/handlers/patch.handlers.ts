import { FastifyRequest, RouteHandler } from 'fastify';
import { z } from 'zod';
import { APIResponse } from '../_utils/_response';
import { IMediaVerifyBody, PatchPaginationBody } from '@actunime/validations';
import { Patch } from '../_lib/media';
import { Checker } from '../_utils/_checker';
import { PatchController } from '../controllers/patch.controllers';

const getPatchById: RouteHandler = async (req) => {
  const { id } = z.object({ id: z.string() }).parse(req.params);
  const res = await Patch.get(id, { nullThrowErr: true });
  return new APIResponse({ success: true, data: res });
};

const filterPatch = async (
  req: FastifyRequest<{ Body: z.infer<typeof PatchPaginationBody> }>
) => {
  const Patchs = await Patch.pagination(req.body);
  return new APIResponse({ success: true, data: Patchs });
};

/** Supprimer la demande de modification d'un anime */
const deletePatch = async (
  req: FastifyRequest<{
    Body: IMediaVerifyBody;
    Params: { id: string };
  }>
) => {
  Checker.userIsDefined(req.user);

  const controller = new PatchController(req.mongooseSession, {
    log: req.logSession,
    user: req.user,
  });

  const res = await controller.delete(
    req.params.id
    // req.body
  );
  return new APIResponse({ success: true, ...res });
};

export const PatchHandlers = {
  getPatchById,
  filterPatch,
  deletePatch,
};
