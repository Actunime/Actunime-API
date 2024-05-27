import { z } from "zod";
import { zodNumber } from "./util";
import { IGroupe } from "../_types/groupeType";

export const Groupe_Pagination_ZOD = z
  .object({
    page: zodNumber(),
    limit: zodNumber(),
    strict: z.boolean().optional(),
    sort: z
      .object({
        createdAt: z.enum(["DESC", "ASC"]).optional(),
        updatedAt: z.enum(["DESC", "ASC"]).optional(),
      })
      .partial()
      .strict(),
    query: z
      .object({
        name: z.string().optional(),
      })
      .partial()
      .strict(),
    with: z.object({
      animes: z.boolean().optional(),
      mangas: z.boolean().optional(),
    }).partial().strict(),
  })
  .partial()
  .strict();

export type IGroupe_Pagination_ZOD = z.infer<typeof Groupe_Pagination_ZOD>;

export const Create_Groupe_ZOD = z.object({
  name: z.string(),
});

export type ICreate_Groupe_ZOD = z.infer<typeof Create_Groupe_ZOD>;

export const Add_Groupe_ZOD = z.object({
  id: z.optional(z.string()),
  newGroupe: z.optional(Create_Groupe_ZOD)
});

export type IAdd_Groupe_ZOD = z.infer<typeof Add_Groupe_ZOD>;


export const GroupeDataToZOD = (data: IGroupe): Partial<ICreate_Groupe_ZOD> => {

  if (!data)
    return {}

  let toZOD: Partial<ICreate_Groupe_ZOD> = {
    name: data.name,
  }

  let safeParse = Create_Groupe_ZOD.safeParse(toZOD);

  if (safeParse.success)
    return safeParse.data

  return toZOD;
}


