import { FastifyReply, FastifyRequest } from 'fastify';
import { Create_Company_ZOD, ICreate_Company_ZOD } from '@/_validation/companyZOD';
import mongoose from 'mongoose';
import { z } from 'zod';
import { CompanyManager } from '@/_lib/company';

export const PatchCompanyRouter = async (
  req: FastifyRequest<{
    Body: {
      data: ICreate_Company_ZOD;
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
      .object({ note: z.string().optional(), data: Create_Company_ZOD.partial() })
      .parse(req.body);

    session.startTransaction();
    const initCompany = new CompanyManager(session, req.user).init(data);
    const company = await initCompany.update(req.params.id, note);

    await session.commitTransaction();
    await session.endSession();

    return company;
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    res.code(400).send();
  }
};

export const RequestPatchCompanyRouter = async (
  req: FastifyRequest<{
    Body: {
      data: ICreate_Company_ZOD;
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
      .object({ note: z.string().optional(), data: Create_Company_ZOD.partial() })
      .parse(req.body);

    session.startTransaction();
    const initCompany = new CompanyManager(session, req.user).init(data);
    const company = await initCompany.updateRequest(req.params.id, note);

    await session.commitTransaction();
    await session.endSession();

    return company;
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    res.code(400).send();
  }
};
