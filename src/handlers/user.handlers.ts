import { RouteHandler } from "fastify";
import { z } from "zod";
import { UserControllers } from "../controllers/user.controllers";
import { APIResponse } from "../_utils/_response";
import { RequestUtil } from "../_utils/_request";


const getUserById: RouteHandler = async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    UserControllers.useSession(req.session);
    const res = await UserControllers.getById(id);
    return new APIResponse({ success: true, data: res });
}

const getCurrentUser: RouteHandler = async (req) => {
    const token = RequestUtil.getToken(req);
    const user = await UserControllers.getUserByToken(token);
    return new APIResponse({ success: true, data: user });
}

export const UserHandlers = {
    getUserById,
    getCurrentUser
};