import { FastifyReply, FastifyRequest } from 'fastify';
import { Create_Track_ZOD, ICreate_Track_ZOD } from '@/_validation/trackZOD';
import mongoose from 'mongoose';
import { z } from 'zod';
import { TrackManager } from '@/_lib/track';

export const PatchTrackRouter = async (
  req: FastifyRequest<{
    Body: {
      data: ICreate_Track_ZOD;
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
      .object({ note: z.string().optional(), data: Create_Track_ZOD.partial() })
      .parse(req.body);

    session.startTransaction();
    const initTrack = await new TrackManager(session, req.user).init(data);
    const track = await initTrack.update(req.params.id, note);

    await session.commitTransaction();
    await session.endSession();
    return track;
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    res.code(400).send();
  }
};

export const RequestPatchTrackRouter = async (
  req: FastifyRequest<{
    Body: {
      data: ICreate_Track_ZOD;
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
      .object({ note: z.string().optional(), data: Create_Track_ZOD.partial() })
      .parse(req.body);

    session.startTransaction();
    const initTrack = await new TrackManager(session, req.user).init(data);
    const track = await initTrack.updateRequest(req.params.id, note);

    await session.commitTransaction();
    await session.endSession();
    return track;
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    res.code(400).send();
  }
};
