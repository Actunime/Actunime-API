import { FastifyRequest } from "fastify";
import { Patch_User_ZOD, IPatch_User_ZOD } from "@actunime/validations";
import { z } from "zod";
import { UserManager } from "../../_lib/user";
import { APIError } from "../../_lib/Error";

export const PatchUserProfileRouter = async (
  req: FastifyRequest<{
    Body: {
      data: IPatch_User_ZOD;
      note: string;
    };
  }>
) => {
  const { data, note } = z
    .object({ note: z.string().optional(), data: Patch_User_ZOD.partial() })
    .parse(req.body);

  const user = req.currentUser;
  if (!user) throw new APIError("Vous n'êtes pas autorisé !", "UNAUTHORIZED");

  const initUser = await new UserManager(req.session, { user, isRequest: true }).init(data);
  const newUser = await initUser.patch(user.id, note);

  return newUser;
};
