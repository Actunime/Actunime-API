import { FastifyRequest, RouteHandler } from 'fastify';
import { z } from 'zod';
import { UserController } from '../controllers/user.controller';
import { APIResponse } from '../_utils/_response';
import { IUserClientCreateBody, IUserCreateBody } from '@actunime/validations';
import { APIError } from '../_lib/error';
import { User } from '../_lib/media/_user';
import { Checker } from '../_utils/_checker';

const getUserById: RouteHandler = async (req) => {
  const { id } = z.object({ id: z.string() }).parse(req.params);
  const res = await User.get(id, { nullThrowErr: true });
  return new APIResponse({ success: true, data: res });
};

const getCurrentUser: RouteHandler = async (req) => {
  return new APIResponse({ success: true, data: req.user });
};

const getUserByAccountId = async (
  req: FastifyRequest<{ Params: { id: string } }>
) => {
  const { id } = z.object({ id: z.string() }).parse(req.params);
  const res = await User.getByAccount(id, { nullThrowErr: true });

  return new APIResponse({ success: true, data: res });
};

const updateCurrentUser = async (
  req: FastifyRequest<{ Body: IUserCreateBody }>
) => {
  const body = req.body;

  if (!Object.keys(body).length)
    throw new APIError("Aucun champ n'a été modifié !", 'EMPTY_CHANGES');

  Checker.userIsDefined(req.user);
  const controller = new UserController(req.mongooseSession, {
    user: req.user,
  });
  const description = req.body.description;
  const input = req.body.data;

  const res = await controller.update(req.user.id, input, { description });

  return new APIResponse({ success: true, ...res });
};

const updateUser = async (
  req: FastifyRequest<{ Body: IUserCreateBody; Params: { id: string } }>
) => {
  Checker.userIsDefined(req.user);
  const controller = new UserController(req.mongooseSession, {
    log: req.logSession,
    user: req.user,
  });

  const description = req.body.description;
  const input = req.body.data;

  const res = await controller.update(req.params.id, input, { description });

  return new APIResponse({ success: true, ...res });
};

const clientCreateUser = async (
  req: FastifyRequest<{ Body: IUserClientCreateBody; Params: { id: string } }>
) => {
  Checker.userIsDefined(req.user);
  const controller = new UserController(req.mongooseSession, {
    log: req.logSession,
    user: req.user,
  });

  const description = req.body.description;
  const input = req.body.data;

  const res = await controller.create(input, { description });

  return new APIResponse({ success: true, ...res });
};

export const UserHandlers = {
  getUserById,
  getCurrentUser,
  getUserByAccountId,
  updateCurrentUser,
  updateUser,
  clientCreateUser,
};
