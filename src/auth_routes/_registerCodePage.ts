import { FastifyRequest, FastifyReply } from "fastify";
import { authClients } from "../_utils/_authClients";

interface getCodeQuery {
    state: string
    client_id: string
}

export const RegisterCodePage = async (
    req: FastifyRequest<{ Querystring: getCodeQuery }>,
    res: FastifyReply,
) => {
    const { client_id } = req.query;
    const client = Object.values(authClients).find((c) => c.clientId === client_id);

    if (!client)
        return res.send({ error: 'Invalid client' });

    return res.sendFile('register_code.html');
}
