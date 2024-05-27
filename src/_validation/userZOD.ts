import { UserRolesArray } from "../_utils/userUtil";
import { z } from "zod";
import { zodNumber } from "./util";

export const User_Pagination_ZOD = z
  .object({
    page: zodNumber(),
    limit: zodNumber(),
    query: z
      .object({
        name: z.string(),
        roles: z.array(z.enum(UserRolesArray)),
      })
      .partial()
      .strict(),
    strict: z.boolean().optional(),
    // with: z.object({
    //   disabled: z.boolean().optional(),
    //   premium: z.boolean().optional(),
    // }).partial().strict(),
  })
  .partial()
  .strict();

export type IUser_Pagination_ZOD = z.infer<typeof User_Pagination_ZOD>;

export const User_Update_ZOD = z.object({
  rolesChanges: z.optional(z.array(z.enum(UserRolesArray))),
  disableUser: z.optional(z.object({
    reason: z.string()
  })),
  enableUser: z.optional(z.object({
    reason: z.string()
  })),
  updatePremium: z.optional(
    z.object({
      level: zodNumber().refine(v => v >= 1 && v <= 4, { message: "Le niveau doit être compris entre 1 et 4" }),
      expires: z.optional(z.string())
    }).refine((v) => {
      if (v.level && !v.expires)
        return false;
    }, { message: "vous devez renseigner la date d'expiration", path: ["expires"] })
  ),
})

export type IUser_Update_ZOD = z.infer<typeof User_Update_ZOD>;