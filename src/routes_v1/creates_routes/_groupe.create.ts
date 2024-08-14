import { FastifyReply, FastifyRequest } from 'fastify';
import { Create_Groupe_ZOD, ICreate_Groupe_ZOD } from '@/_validation/groupeZOD';
import mongoose from 'mongoose';
import { z } from 'zod';
import { GroupeManager } from '@/_lib/groupe';

export const CreateGroupeRouter = async (
  req: FastifyRequest<{
    Body: {
      data: ICreate_Groupe_ZOD;
      note: string;
    };
  }>,
  res: FastifyReply
) => {
  const session = await mongoose.startSession();

  try {
    const { data, note } = z
      .object({ note: z.string().optional(), data: Create_Groupe_ZOD })
      .parse(req.body);

    session.startTransaction();
    const initGroupe = new GroupeManager(session, req.user).init(data);
    const groupe = await initGroupe.create(note);

    await session.commitTransaction();
    await session.endSession();
    return groupe;
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    res.code(400).send();
  }
};

export const RequestCreateGroupeRouter = async (
  req: FastifyRequest<{
    Body: {
      data: ICreate_Groupe_ZOD;
      note: string;
    };
  }>,
  res: FastifyReply
) => {
  const session = await mongoose.startSession();

  try {
    const { data, note } = z
      .object({ note: z.string().optional(), data: Create_Groupe_ZOD })
      .parse(req.body);

    session.startTransaction();
    const initGroupe = new GroupeManager(session, req.user).init(data);
    const groupe = await initGroupe.createRequest(note);

    await session.commitTransaction();
    await session.endSession();
    return groupe;
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    res.code(400).send();
  }
};
