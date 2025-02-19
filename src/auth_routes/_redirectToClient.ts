import { z } from "zod";
import { authClients } from "../_utils/_authClients";
import { FastifyReply, FastifyRequest } from "fastify";


export const RedirectToClient = (req: FastifyRequest, res: FastifyReply) => {

    const { data, error } = z.object({
        client_id: z.string().refine((v) => Object.keys(authClients).includes(v), { message: "Client invalide" })
    }).safeParse(req.query);

    if (error)
        res.status(400).send({ error: error.message });

    if (data) {
        const callback = authClients[data.client_id as keyof typeof authClients].redirectUri;
        const url = new URL(callback);
        res.redirect(`${url.origin}`);
    } else {
        res.status(400).send({ error: "Client invalide" });
    }
}