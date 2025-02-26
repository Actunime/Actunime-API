import { FastifyInstance } from "fastify";
import mongoose from "mongoose";
import { mongooseCache } from "../_utils";

export const OnCloseHook = async (fastify: FastifyInstance) => {
    fastify.addHook('onClose', async () => {
        await mongooseCache.close();
        await mongoose.connection.close();
    })
}