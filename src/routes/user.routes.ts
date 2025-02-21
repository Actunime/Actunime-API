import { FastifyInstance } from "fastify";
import { UserHandlers } from "../handlers/user.handlers";

function UserRoutes(fastify: FastifyInstance) {
    fastify.get("/:id", {
        schema: {
            description: "",
            tags: ["User"]
        },
    }, UserHandlers.getUserById);

    fastify.get("/me", {
        schema: {
            description: "",
            tags: ["User"]
        },
    }, UserHandlers.getCurrentUser);
}

export default UserRoutes;