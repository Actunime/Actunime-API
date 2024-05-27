import { z } from "zod";
import { zodDate } from "./util";

export const MediaDate_validation = z.object({
  start: z.optional(z.string().refine((v) => zodDate().safeParse(v).success, { message: "date invalide" })),
  end: z.optional(z.string().refine((v) => zodDate().safeParse(v).success, { message: "date invalide" })),
});

export const MediaImage_validation = z.object({
  cover: z.optional(z.string()),
  banner: z.optional(z.string()),
});

const urlRegex =
  /^(https:\/\/)?([a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?)$/;
export const Create_Link_ZOD = z.object({
  name: z.string().min(3, "le nom dois contenir au moins 3 caractères"),
  value: z.string().refine((value) => urlRegex.test(value), {
    message: "Doit être une URL HTTPS valide",
  }),
});

export type ICreate_Link_ZOD = z.infer<typeof Create_Link_ZOD>;

export const MediaTitle_validation = z.object({
  default: z.string().min(3, "le nom doit contenir au moins 3 caractères"),
  // .refine((v) => !!v, {
  //   message: "La valeur par défaut est obligatoire",
  // }),
  alias: z.optional(z.array(z.string().min(2, "le nom doit contenir au moins 2 caractères"))),
})
  .refine(
    (v) =>
      !v.alias?.includes(v.default) ||
      `La valeur de alias ne doit pas contenir la valeur par défaut`
  );