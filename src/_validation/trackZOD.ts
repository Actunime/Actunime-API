import { TrackTypeArray } from '../_utils/trackUtil';
import { z } from 'zod';
import { Create_Link_ZOD } from './media';
import { Add_Person_ZOD } from './personZOD';
import { zodNumber } from './util';
import { dateToZod } from '../_utils/mediaUtil';
import { ITrack } from '../_types/trackType';
import { Add_Image_ZOD } from './imageZOD';

export const Track_Pagination_ZOD = z
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
        artists: z.boolean().optional()
      })
      .partial()
      .strict()
  })
  .partial()
  .strict();

export type ITrack_Pagination_ZOD = z.infer<typeof Track_Pagination_ZOD>;

export const Create_Track_ZOD = z
  .object({
    name: z.object({ default: z.string(), native: z.optional(z.string()) }),
    type: z.enum(TrackTypeArray),
    pubDate: z.optional(z.string()),
    artists: z.optional(z.array(Add_Person_ZOD)),
    cover: z.optional(Add_Image_ZOD),
    links: z.optional(z.array(Create_Link_ZOD))
  })
  .strict();

export type ICreate_Track_ZOD = z.infer<typeof Create_Track_ZOD>;

export const Add_Track_ZOD = z.object({
  id: z.optional(z.string()),
  newTrack: z.optional(Create_Track_ZOD)
});

export type IAdd_Track_ZOD = z.infer<typeof Add_Track_ZOD>;

export const TrackDataToZOD = (data: ITrack): Partial<ICreate_Track_ZOD> => {
  if (!data) return {};

  const toZOD: Partial<ICreate_Track_ZOD> = {
    name: data.name,
    type: data.type,
    pubDate: dateToZod(data.pubDate),
    cover: data.cover,
    artists: data.artists
  };

  const safeParse = Create_Track_ZOD.safeParse(toZOD);

  if (safeParse.success) return safeParse.data;

  return toZOD;
};
