import { FastifyRequest, RouteHandlerMethod } from "fastify";
import { z } from "zod";
import { AccountControllers } from "../controllers/account.controllers";
import { APIResponse } from "../_utils/_response";
import { RequestUtil } from "../_utils/_request";
import { UserControllers } from "../controllers/user.controllers";
import { AccountSchema } from "../schema/account.schema";
import { EmailCodeControllers } from "../controllers/emailCode.controllers";

const getAccountById: RouteHandlerMethod = async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    AccountControllers.useSession(req.session);
    const res = await AccountControllers.getById(id);
    return new APIResponse({ success: true, data: res });
}

const getCurrentAccount: RouteHandlerMethod = async (req) => {
    const token = RequestUtil.getToken(req);
    const user = await UserControllers.getUserByToken(token);
    const account = await AccountControllers.getByUserId(user.id);
    return new APIResponse({ success: true, data: account });
}

const startResetPassword = async (req: FastifyRequest<{ Body: z.infer<typeof AccountSchema.StartResetPasswordBody> }>) => {
    const { email, captcha } = req.body;
    await AccountControllers.genResetPassword(email);
    return new APIResponse({ success: true });
}

const verifyPasswordCode = async (req: FastifyRequest<{ Body: z.infer<typeof AccountSchema.PasswordCodeBody> }>) => {
    const { email, code } = req.body;
    await EmailCodeControllers.getByEmailAndCode(email, code);
    return new APIResponse({ success: true });
}

const resetPassword = async (req: FastifyRequest<{ Body: z.infer<typeof AccountSchema.ResetPasswordBody> }>) => {
    const { email, code, newPassword } = req.body;
    await AccountControllers.handleResetPassword(email, code, newPassword);
    return new APIResponse({ success: true });
}

const resetPasswordWithOldPassword = async (req: FastifyRequest<{ Body: z.infer<typeof AccountSchema.ResetPasswordWithOldPassword> }>) => {
    const { password, newPassword, captcha } = req.body;
    const token = RequestUtil.getToken(req);
    const user = await UserControllers.getUserByToken(token);
    const account = await AccountControllers.getByUserId(user.id);
    await AccountControllers.handleResetPasswordWithPassword({ password, newPassword }, account.email);
    return new APIResponse({ success: true });
}


export const AccountHandlers = {
    getAccountById,
    getCurrentAccount,
    startResetPassword,
    verifyPasswordCode,
    resetPassword,
    resetPasswordWithOldPassword
};