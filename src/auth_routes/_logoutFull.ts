import { AccessTokenModel } from "@actunime/mongoose-models";
import { FastifyRequest, FastifyReply } from "fastify";

export const LogoutFull = async (
    req: FastifyRequest,
    res: FastifyReply,
) => {
    const user = req.currentUser;

    if (!user) return res.status(401).send({ error: "Unauthorized" });

    const deleted = await AccessTokenModel.deleteMany({ userId: user.id });

    if (deleted.deletedCount > 0)
        return res.status(200).send({});
    else
        return res.status(404).send({});
}
