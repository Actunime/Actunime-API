import { FastifyRequest } from "fastify";
import { Create_Track_ZOD, ICreate_Track_ZOD } from "@actunime/validations";
import { z } from "zod";
import { TrackManager } from "../../_lib/track";
import { APIError } from "../../_lib/Error";

export const CreateTrackRouter = async (
  req: FastifyRequest<{
    Body: {
      data: ICreate_Track_ZOD;
      note: string;
    };
  }>,
) => {


  const { data, note } = z
    .object({ note: z.string().optional(), data: Create_Track_ZOD })
    .parse(req.body);

  const user = req.currentUser;
  if (!user) throw new APIError("Vous n'êtes pas autorisé !", "UNAUTHORIZED");

  const initTrack = await new TrackManager(req.session, { user }).init(data);
  await initTrack.create(note);

  return {
    success: true,
  };
};

export const RequestCreateTrackRouter = async (
  req: FastifyRequest<{
    Body: {
      data: ICreate_Track_ZOD;
      note: string;
    };
  }>,
) => {
  const { data, note } = z
    .object({ note: z.string().optional(), data: Create_Track_ZOD })
    .parse(req.body);

  const user = req.currentUser;
  if (!user) throw new APIError("Vous n'êtes pas autorisé !", "UNAUTHORIZED");

  const initTrack = await new TrackManager(req.session, { user, isRequest: true }).init(data);
  await initTrack.createRequest(note);

  return {
    success: true,
  };
};
