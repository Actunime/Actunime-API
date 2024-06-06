import { PersonRoleArray } from '../_utils/personUtil';
import { z } from 'zod';
import { Create_Link_ZOD } from './media';
import { zodNumber } from './util';
import { IPerson } from '../_types/personType';
import { dateToZod } from '../_utils/mediaUtil';

export const PersonName_validation = z.object({
  first: z.string().min(2, 'le prénom dois contenir au moins 2 caractères'),
  last: z.string().min(2, 'le nom dois contenir au moins 2 caractères'),
  alias: z.optional(z.array(z.string()))
});

export const Create_Person_ZOD = z
  .object({
    name: PersonName_validation,
    birthDate: z.optional(z.string()),
    deathDate: z.optional(z.string()),
    bio: z.optional(z.string()),
    image: z.optional(z.string()),
    links: z.optional(z.array(Create_Link_ZOD))
  })
  .strict();

export type ICreate_Person_ZOD = z.infer<typeof Create_Person_ZOD>;

export const Person_Pagination_ZOD = z
  .object({
    page: zodNumber(),
    limit: zodNumber(),
    strict: z.boolean().optional(),
    sort: z
      .object({
        updaptedAt: z.enum(['DESC', 'ASC']).optional(),
        createdAt: z.enum(['DESC', 'ASC']).optional()
      })
      .partial()
      .strict(),
    query: z
      .object({
        name: z.string()
      })
      .partial()
      .strict(),
    with: z.object({}).partial().strict()
  })
  .partial()
  .strict();

export type IPerson_Pagination_ZOD = z.infer<typeof Person_Pagination_ZOD>;

export const Add_Person_ZOD = z.object({
  id: z.optional(z.string()),
  newPerson: z.optional(Create_Person_ZOD),
  role: z.optional(z.enum(PersonRoleArray))
});

export type IAdd_Person_ZOD = z.infer<typeof Add_Person_ZOD>;

export const PersonDataToZOD = (data: IPerson): Partial<ICreate_Person_ZOD> => {
  if (!data) return {};

  const toZOD: Partial<ICreate_Person_ZOD> = {
    name: data.name,
    birthDate: dateToZod(data.birthDate),
    deathDate: dateToZod(data.deathDate),
    bio: data.bio,
    image: data.image,
    links: data.links
  };

  const safeParse = Create_Person_ZOD.safeParse(toZOD);

  if (safeParse.success) return safeParse.data;

  return toZOD;
};
