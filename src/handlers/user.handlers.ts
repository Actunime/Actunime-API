import { FastifyRequest, RouteHandler } from 'fastify';
import { z } from 'zod';
import { UserController } from '../controllers/user.controller';
import { APIResponse } from '../_utils/_response';
import { IUserMutationBody } from '@actunime/validations';
import { APIError } from '../_lib/Error';
import { genPublicID } from '@actunime/utils';

const getUserById: RouteHandler = async (req) => {
  const { id } = z.object({ id: z.string() }).parse(req.params);
  const res = await new UserController(req.mongooseSession).getById(id);
  return new APIResponse({ success: true, data: res });
};

const getCurrentUser: RouteHandler = async (req) => {
  return new APIResponse({ success: true, data: req.user });
};

const getUserByAccountId = async (
  req: FastifyRequest<{ Params: { id: string } }>
) => {
  const { id } = z.object({ id: z.string() }).parse(req.params);
  const res = await new UserController(req.mongooseSession).getByAccountId(id);

  return new APIResponse({ success: true, data: res });
};

const updateCurrentUser = async (
  req: FastifyRequest<{ Body: IUserMutationBody }>
) => {
  const body = req.body;

  if (!Object.keys(body).length)
    throw new APIError("Aucun champ n'a été modifié !", 'EMPTY_CHANGES');

  const refId = genPublicID(8);
  const controller = new UserController(req.mongooseSession);
  const description = '';

  const builded = await controller.build(
    body,
    { username: req.account!.username, accountId: req.account!.id },
    { refId, description }
  );

  const updatedUser = await builded.save({ session: req.mongooseSession });

  return new APIResponse({
    success: true,
    data: controller.parse(updatedUser),
  });
};

export const UserHandlers = {
  getUserById,
  getCurrentUser,
  getUserByAccountId,
  updateCurrentUser,
};
