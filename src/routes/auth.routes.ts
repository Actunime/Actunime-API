import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";

function AuthRoutes(fastify: FastifyInstance) {
    const app = fastify.withTypeProvider<ZodTypeProvider>();

    app.get('/create-profile', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        console.log(request.account);
        return {
            message: 'Vous êtes authentifié!'
        };
    });
}

export default AuthRoutes;