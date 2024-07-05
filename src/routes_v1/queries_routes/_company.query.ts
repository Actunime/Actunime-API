import { FastifyReply, FastifyRequest } from 'fastify';
import mongoose from 'mongoose';
import { CompanyManager } from '@/_lib/company';
import { FilterRouter, GetRouter } from '@/_lib/interfaces';
import { Company_Pagination_ZOD } from '@/_validation/companyZOD';

export const GetCompanyRouter = async (req: FastifyRequest<GetRouter>, res: FastifyReply) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const paramWithMedia = req.query.withMedia;
    const JSONWithMedia = JSON.parse(paramWithMedia || '{}');
    const company = await new CompanyManager(session).get(req.params.id, JSONWithMedia);

    await session.commitTransaction();
    await session.endSession();

    return company;
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    res.code(400).send();
  }
};

export const FilterCompanyRouter = async (req: FastifyRequest<FilterRouter>, res: FastifyReply) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const paramPagination = JSON.parse(req.query.pagination || '{}');
    const data = Company_Pagination_ZOD.parse(paramPagination);
    const company = await new CompanyManager(session).filter(data);

    await session.commitTransaction();
    await session.endSession();

    return company;
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    res.code(400).send();
  }
};
