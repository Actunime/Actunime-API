import { DevLog } from "@actunime/utils";
import { FastifyReply, FastifyRequest } from "fastify";
import mongoose, { ClientSession } from "mongoose";

export const activesSessions = new Map<string, ClientSession>();

export const addSessionHandler = async (req: FastifyRequest) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    req.session = session;
    activesSessions.set(req.id, session);
    DevLog("SessionMongoose en cours d'utilisation", "debug");
};

export const removeSessionHandler = async (req: FastifyRequest, res: FastifyReply) => {
    const status = res.statusCode;
    if (req.session && req.session.inTransaction()) {
        if (status >= 400) {
            await req.session.abortTransaction();
            await req.session.endSession();
            activesSessions.delete(req.id);
            DevLog("SessionMongoose annulée", "warn");
        } else {
            await req.session.commitTransaction();
            await req.session.endSession();
            activesSessions.delete(req.id);
            DevLog("SessionMongoose validée", "debug");
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        req.session = undefined as any;
    }
}