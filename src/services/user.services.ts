import { UserModel } from "@actunime/mongoose-models";
import { FastifyInstance, FastifyReply, FastifyRequest, RouteHandler } from "fastify";
import { ClientSession } from "mongoose";

class UserServices {
    private session: ClientSession | null = null;
    public setSession(session: ClientSession) {
        this.session = session;
    }
    async getUserById(id: string) {
        const user = await UserModel.findOne({ id }).session(this.session);
        return user
    }


}

export { UserServices };