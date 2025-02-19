import { FastifyRequest } from "fastify";

export const MeRouter = async (
    req: FastifyRequest
) => {

    return req.currentUser;
}