import { FastifyReply, FastifyRequest } from 'fastify';
import mongoose from 'mongoose';
import { ReportManager } from '@/_lib/report';
import { FilterRouter, GetRouter } from '@/_lib/interfaces';
import { Report_Pagination_ZOD } from '@/_validation/reportZOD';

export const GetReportRouter = async (req: FastifyRequest<GetRouter>, res: FastifyReply) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const paramWithMedia = req.query.withMedia;
    const JSONWithMedia = JSON.parse(paramWithMedia || 'object');
    const report = await new ReportManager(session, req.user).get(req.params.id, JSONWithMedia);

    await session.commitTransaction();
    await session.endSession();

    return report;
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    res.code(400).send();
  }
};

export const FilterReportRouter = async (req: FastifyRequest<FilterRouter>, res: FastifyReply) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const paramPagination = JSON.parse(req.query.pagination || '{}');
    const data = Report_Pagination_ZOD.parse(paramPagination);
    const report = await new ReportManager(session, req.user).filter(data);

    await session.commitTransaction();
    await session.endSession();

    return report;
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    res.code(400).send();
  }
};
