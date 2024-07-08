import { FastifyReply, FastifyRequest } from 'fastify';
import { Patch_User_ZOD, IPatch_User_ZOD } from '@/_validation/userZOD';
import mongoose from 'mongoose';
import { z } from 'zod';
import { UserManager } from '@/_lib/user';

export const PatchUserRouter = async (
    req: FastifyRequest<{
        Body: {
            data: IPatch_User_ZOD;
            note: string;
        };
        Params: {
            id: string;
        };
    }>,
    res: FastifyReply
) => {
    const session = await mongoose.startSession();

    try {
        const { data, note } = z
            .object({ note: z.string().optional(), data: Patch_User_ZOD.partial() })
            .parse(req.body);

        session.startTransaction();
        const initUser = await new UserManager(session, req.user).init(data);
        const user = await initUser.update(req.params.id, note);

        await session.commitTransaction();
        await session.endSession();
        return user;
    } catch (err) {
        console.log(err);
        await session.abortTransaction();
        res.code(400).send();
    }
};