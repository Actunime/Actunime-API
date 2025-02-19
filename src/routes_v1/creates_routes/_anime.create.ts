import { FastifyRequest } from "fastify";
import { Create_Anime_ZOD, ICreate_Anime_ZOD } from "@actunime/validations";
import { z } from "zod";
import { AnimeManager } from "../../_lib/anime";
import { APIError } from "../../_lib/Error";
import { HCaptchaIsValid } from "../../_utils/_verifyCaptcha";

export const CreateAnimeRouter = async (
  req: FastifyRequest<{
    Body: {
      data: ICreate_Anime_ZOD;
      note: string;
    };
  }>,
) => {
  const { data, note } = z
    .object({ note: z.string().optional(), data: Create_Anime_ZOD })
    .parse(req.body);

  const user = req.currentUser;
  if (!user) throw new APIError("Vous n'êtes pas autorisé !", "UNAUTHORIZED");

  const initAnime = await new AnimeManager(req.session, { user }).init(data);
  await initAnime.create(note);

  return {
    success: true,
  };
};

export const RequestCreateAnimeRouter = async (
  req: FastifyRequest<{
    Body: {
      data: ICreate_Anime_ZOD;
      note: string;
      "h-captcha-response": string;
    };
  }>,
) => {
  const { data, note, "h-captcha-response": hCaptchaResponse } = z
    .object({
      note: z.string().optional(),
      data: Create_Anime_ZOD,
      "h-captcha-response": z.string(),
    })
    .parse(req.body);

  const captchaIsValid = await HCaptchaIsValid(hCaptchaResponse);
  if (!captchaIsValid)
    throw new APIError("Le captcha n'a pas pu à fonctionner. Veuillez recommencer.", "BAD_REQUEST");


  const user = req.currentUser;
  if (!user)
    throw new APIError("Vous n'êtes pas autorisé !", "UNAUTHORIZED");

  const initAnime = await new AnimeManager(req.session, { user, isRequest: true }).init(data);
  await initAnime.createRequest(note);

  return {
    success: true,
  };
};
