import { FastifyRequest, FastifyReply, RequestGenericInterface, RouteShorthandOptionsWithHandler } from "fastify";
import { UserServices } from "../services/user.services";
import { z } from "zod";
import { addSessionHandler } from "../_utils";
import { UserManager } from "../_lib/user";

const userService = new UserServices();
// const userManager = new UserManager();

export const getUserById: RouteShorthandOptionsWithHandler = {
    preValidation: [],
    // preHandler: [addSessionHandler],
    handler: (req, res) => {
        const { id } = z.object({ id: z.string() }).parse(req.params);
        // userService.setSession(req.session);
        // const user = userService.getUserById(id);

        return {
            id
        }
    }
}