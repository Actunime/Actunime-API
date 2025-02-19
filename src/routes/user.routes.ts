import { FastifyInstance, RouteShorthandOptions, RouteShorthandOptionsWithHandler } from "fastify";
import * as userControllers from "../controllers/user.controllers";
import { addSessionHandler } from "../_utils";




function UserRoutes(fastify: FastifyInstance) {
    fastify.get("/:id", userControllers.getUserById);
}

export default UserRoutes;