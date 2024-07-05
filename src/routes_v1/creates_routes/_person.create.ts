import { FastifyReply, FastifyRequest } from 'fastify';
import { Create_Person_ZOD, ICreate_Person_ZOD } from '@/_validation/personZOD';
import mongoose from 'mongoose';
import { z } from 'zod';
import { PersonManager } from '@/_lib/person';

export const CreatePersonRouter = async (
  req: FastifyRequest<{
    Body: {
      data: ICreate_Person_ZOD;
      note: string;
    };
  }>,
  res: FastifyReply
) => {
  const session = await mongoose.startSession();

  try {
    const { data, note } = z
      .object({ note: z.string().optional(), data: Create_Person_ZOD })
      .parse(req.body);

    session.startTransaction();
    const initPerson = await new PersonManager(session, req.user).init(data);
    const person = await initPerson.create(note);

    await session.commitTransaction();
    await session.endSession();
    return person;
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    res.code(400).send();
  }
};

export const RequestCreatePersonRouter = async (
  req: FastifyRequest<{
    Body: {
      data: ICreate_Person_ZOD;
      note: string;
    };
  }>,
  res: FastifyReply
) => {
  const session = await mongoose.startSession();

  try {
    const { data, note } = z
      .object({ note: z.string().optional(), data: Create_Person_ZOD })
      .parse(req.body);

    session.startTransaction();
    const initPerson = await new PersonManager(session, req.user).init(data);
    const person = await initPerson.createRequest(note);

    await session.commitTransaction();
    await session.endSession();
    return person;
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    res.code(400).send();
  }
};
