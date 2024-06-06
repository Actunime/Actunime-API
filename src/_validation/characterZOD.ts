import {
  CharacterGenderArray,
  CharacterRoleArray,
  CharacterSpeciesArray
} from '../_utils/characterUtil';
import { z } from 'zod';
import { Add_Person_ZOD } from './personZOD';
import { zodNumber } from './util';
import { ICharacter } from '../_types/characterType';
import { dateToZod } from '../_utils/mediaUtil';

export const Character_Pagination_ZOD = z
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
        name: z.optional(z.string())
      })
      .partial()
      .strict(),
    with: z
      .object({
        actors: z.boolean().optional()
      })
      .partial()
      .strict()
  })
  .partial()
  .strict();

export type ICharacter_Pagination_ZOD = z.infer<typeof Character_Pagination_ZOD>;

export const Character_Name_ZOD = z.object({
  first: z.string().min(2, '2 caractères minimum'),
  last: z.optional(z.string()),
  alias: z.optional(z.array(z.string().min(2, '2 caractères minimum').trim()))
});

export const Create_Character_ZOD = z
  .object({
    name: Character_Name_ZOD,
    age: z.optional(zodNumber()),
    birthDate: z.optional(z.string()),
    gender: z.enum(CharacterGenderArray),
    species: z.enum(CharacterSpeciesArray),
    bio: z.optional(z.string()),
    image: z.optional(z.string()),
    actors: z.optional(z.array(Add_Person_ZOD))
  })
  .strict();

export type ICreate_Character_ZOD = z.infer<typeof Create_Character_ZOD>;

export const Add_Character_ZOD = z.object({
  id: z.optional(z.string()),
  newCharacter: z.optional(Create_Character_ZOD),
  role: z.enum(CharacterRoleArray)
});

export type IAdd_Character_ZOD = z.infer<typeof Add_Character_ZOD>;

export const CharacterDataToZOD = (data: ICharacter): Partial<ICreate_Character_ZOD> => {
  if (!data) return {};

  const toZOD: Partial<ICreate_Character_ZOD> = {
    name: data.name,
    age: data.age,
    birthDate: dateToZod(data.birthDate),
    gender: data.gender,
    species: data.species,
    bio: data.bio,
    image: data.image,
    actors: data.actors
  };

  const safeParse = Create_Character_ZOD.safeParse(toZOD);

  if (safeParse.success) return safeParse.data;

  return toZOD;
};
