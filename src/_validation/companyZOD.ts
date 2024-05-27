import { CompanyTypeArray } from "../_utils/companyUtil";
import { z } from "zod";
import { Create_Link_ZOD } from "./media";
import { zodNumber } from "./util";
import { ICompany } from "../_types/companyType";
import { dateToZod } from "../_utils/mediaUtil";

export const Company_Pagination_ZOD = z
  .object({
    page: zodNumber(),
    limit: zodNumber(),
    strict: z.boolean().optional(),
    sort: z
      .object({
        updaptedAt: z.enum(["DESC", "ASC"]).optional(),
        createdAt: z.enum(["DESC", "ASC"]).optional(),
      })
      .partial()
      .strict(),
    query: z
      .object({
        name: z.string().optional(),
        type: z.enum(CompanyTypeArray)
      })
      .partial()
      .strict(),
    with: z.object({}).partial().strict(),
  })
  .partial()
  .strict();

export type ICompany_Pagination_ZOD = z.infer<typeof Company_Pagination_ZOD>;

export const Create_Company_ZOD = z.object({
  type: z.enum(["STUDIO", "PRODUCER"]),
  name: z.string(),
  links: z.optional(z.array(Create_Link_ZOD)),
  image: z.optional(z.string()),
  createdDate: z.optional(z.string()),
}).strict();

export type ICreate_Company_ZOD = z.infer<typeof Create_Company_ZOD>;

export const Add_Company_ZOD = z.object({
  id: z.optional(z.string()),
  newCompany: z.optional(Create_Company_ZOD)
});

export type IAdd_Company_ZOD = z.infer<typeof Add_Company_ZOD>;


export const CompanyDataToZOD = (data: ICompany): Partial<ICreate_Company_ZOD> => {

  if (!data)
    return {}

  let toZOD: Partial<ICreate_Company_ZOD> = {
    type: data.type,
    name: data.name,
    links: data.links,
    image: data.image,
    createdDate: dateToZod(data.createdDate),
  }

  let safeParse = Create_Company_ZOD.safeParse(toZOD);

  if (safeParse.success)
    return safeParse.data

  return toZOD;
}


