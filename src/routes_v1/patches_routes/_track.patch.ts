import { FastifyRequest } from "fastify";
import { Create_Track_ZOD, ICreate_Track_ZOD } from "@actunime/validations";
import { z } from "zod";
import { TrackManager } from "../../_lib/track";
import { APIError } from "../../_lib/Error";

export const PatchTrackRouter = async (
  req: FastifyRequest<{
    Body: {
      data: ICreate_Track_ZOD;
      note: string;
    };
    Params: {
      id: string;
    };
  }>
) => {

  const { data, note } = z
    .object({ note: z.string().optional(), data: Create_Track_ZOD.partial() })
    .parse(req.body);

  const user = req.currentUser;
  if (!user) throw new APIError("Vous n'êtes pas autorisé !", "UNAUTHORIZED");
  const initTrack = await new TrackManager(req.session, { user }).init(data);
  await initTrack.patch(req.params.id, note);

  return {
    success: true,
  };
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
  }>
) => {
  const { data, note } = z
    .object({ note: z.string().optional(), data: Create_Track_ZOD.partial() })
    .parse(req.body);

  const user = req.currentUser;
  if (!user) throw new APIError("Vous n'êtes pas autorisé !", "UNAUTHORIZED");
  const initTrack = await new TrackManager(req.session, { user }).init(data);
  await initTrack.updateRequest(req.params.id, note);

  return {
    success: true,
  };
};
