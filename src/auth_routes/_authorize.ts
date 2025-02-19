import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";


export async function Authorize(
    this: FastifyInstance,
    req: FastifyRequest<{ Querystring: { code: string, state: string } }>,
    res: FastifyReply,
) {
    return res.status(404).send();
    // try {
    //     const { code, state } = z.object({
    //         code: z.string(),
    //         state: z.string()
    //     }).parse(req.query);

    //     const secureCode = this.jwt.sign({ code, state }, { expiresIn: '1h' });

    //     // Verification du code pour échange token;
    //     res.redirect(`${authClients[client_id as keyof typeof authClients].redirectUri}?code=${secureCode}&state=${state}`);

    // } catch (error) {
    //     res.status(400);
    //     console.error(error);
    // }
}