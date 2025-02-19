import { FastifyRequest, FastifyReply } from "fastify";
import { authClients } from "../_utils/_authClients";

interface getLoginQuery {
    code: string,
    client_id: string,
    client_secret: string
}

export const LoginPage = async (
    req: FastifyRequest<{ Querystring: getLoginQuery }>,
    res: FastifyReply,
) => {
    const { client_id } = req.query;
    const client = Object.values(authClients).find((c) => c.clientId === client_id);

    if (!client)
        return res.send({ error: 'Invalid client' });

    return res.sendFile('login.html');
}
