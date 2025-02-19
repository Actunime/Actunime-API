import { AccessTokenModel, AuthorizationCodeModel } from "@actunime/mongoose-models";
import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import { z } from "zod";

export async function Token(
    this: FastifyInstance,
    req: FastifyRequest<{ Body: { code: string; } }>,
    res: FastifyReply,
) {
    const { code } = z.object({ code: z.string().min(15).max(15) }).parse(req.body);

    const findCode = await AuthorizationCodeModel.findOne({ code });

    if (!findCode)
        return res.status(400).send({ error: "Invalid code" });

    await AuthorizationCodeModel.deleteOne({ code });

    const token = this.jwt.sign({ userId: findCode.userId });

    await AccessTokenModel.create({
        token,
        userId: findCode.userId,
        clientId: findCode.clientId,
        device: findCode.device
    });

    res.send({ access_token: token, token_type: 'Bearer' });
}
