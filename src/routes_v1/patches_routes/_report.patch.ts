import { FastifyReply, FastifyRequest } from 'fastify';
import { ICreate_Report_ZOD, Patch_Report_ZOD } from '@/_validation/reportZOD';
import mongoose from 'mongoose';
import { z } from 'zod';
import { ReportManager } from '@/_lib/report';

export const PatchReportRouter = async (
    req: FastifyRequest<{
        Body: {
            data: ICreate_Report_ZOD;
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
            .object({ note: z.string().optional(), data: Patch_Report_ZOD })
            .parse(req.body);

        session.startTransaction();
        const initReport = new ReportManager(session, req.user).init(data);
        const report = await initReport.update(req.params.id, note);

        await session.commitTransaction();
        await session.endSession();
        return report;
    } catch (err) {
        console.log(err);
        await session.abortTransaction();
        res.code(400).send();
    }
};