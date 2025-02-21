import { FastifyRequest, RouteHandler, RouteHandlerMethod } from "fastify";
import { z } from "zod";
import { AccountControllers } from "../controllers/account.controllers";
import { Inscription_Zod_Schema } from "@actunime/validations";
import { APIResponse } from "../_utils/_response";
import { HCaptchaIsValid } from "../_utils";
import { APIError } from "../_lib/Error";
import { TokenControllers } from "../controllers/token.controllers";
import { RequestUtil } from "../_utils/_request";
import { UserControllers } from "../controllers/user.controllers";
import { IUserRoles, userPermissionIsHigherThan } from "@actunime/types";
import { DevLog } from "@actunime/utils";
import { AuthSchema } from "../schema/auth.schema";

const AuthRoles = (roles: IUserRoles | IUserRoles[]): RouteHandlerMethod => {
    return async (req) => {
        const token = RequestUtil.getToken(req);
        const user = await UserControllers.getUserByToken(token)

        if (Array.isArray(roles) && !userPermissionIsHigherThan(user.roles, roles)) {
            DevLog("Utilisateur bloqué", "error");
            throw new APIError("Vous n'êtes pas autorisé !", "UNAUTHORIZED")
        }

        if (!Array.isArray(roles) && !userPermissionIsHigherThan(user.roles, [roles])) {
            DevLog("Utilisateur bloqué", "error");
            throw new APIError("Vous n'êtes pas autorisé !", "UNAUTHORIZED")
        }

        DevLog("Utilisateur authentifié", "debug");
    }
}


const Login = async (req: FastifyRequest<{ Body: z.infer<typeof AuthSchema.LoginBody> }>) => {
    const { email, password, captcha } = req.body;

    // const captchaIsValid = await HCaptchaIsValid(captcha);
    // if (!captchaIsValid)
    //     throw new APIError("Le captcha est invalide. Veuillez recommencer.", "BAD_REQUEST");

    const account = await AccountControllers
        .useSession(req.session)
        .authWithPassword(email, password);

    const clientId = "actunime_website" // RequestUtil.getClientId(req);
    const device = RequestUtil.getDevice(req) || "";

    const token = await TokenControllers
        .useSession(req.session)
        .createAccesToken({ clientId, userId: account.userId, device });

    return new APIResponse({ success: true, data: token.parsedToken() });
}

const Logout: RouteHandler = async (req) => {
    const token = RequestUtil.getToken(req);
    const deleted = await TokenControllers.deleteAccesToken(token);
    return new APIResponse({ success: deleted, message: "Vous avez été déconnecté !" });
}

const PreRegister: RouteHandler = async (req) => {
    const { captcha, ...data } = Inscription_Zod_Schema.parse(req.body);

    const captchaIsValid = await HCaptchaIsValid(captcha);
    if (!captchaIsValid)
        throw new APIError("Le captcha est invalide. Veuillez recommencer.", "BAD_REQUEST");

    const device = RequestUtil.getDevice(req);

    await AccountControllers
        .useSession(req.session)
        .genRegisterCode(data, device);

    return new APIResponse({ success: true, message: "Un email vous a été envoyé." });
}

const Register: RouteHandler = async (req) => {
    const { email, code } = z.object({ email: z.string().email(), code: z.string() }).parse(req.body);
    const newAccount = await AccountControllers
        .useSession(req.session)
        .handleRegisterCode(email, code);

    const clientId = RequestUtil.getClientId(req);
    const device = RequestUtil.getDevice(req) || "";

    const token = await TokenControllers
        .useSession(req.session)
        .createAccesToken({ clientId, userId: newAccount.userId, device });

    return new APIResponse({ success: true, data: token.parsedToken() });
}

const RefreshToken: RouteHandler = async (req) => {
    const { token } = z.object({ token: z.string() }).parse(req.body);
    const newToken = await TokenControllers.getNewTokenByRefreshToken(token);
    return new APIResponse({ success: true, data: newToken.parsedToken() });
}

export const AuthHandlers = {
    Login,
    Logout,
    PreRegister,
    Register,
    RefreshToken,
    AuthRoles
};