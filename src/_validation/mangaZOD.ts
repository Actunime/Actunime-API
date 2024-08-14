import { IManga } from '../_types/mangaType';
import { MangaFormatArray } from '../_utils/mangaUtil';
import {
  MediaGenresArray,
  MediaParentLabelArray,
  MediaSourceArray,
  MediaStatusArray,
  dateTimeToZod,
  dateToZod
} from '../_utils/mediaUtil';
import { z } from 'zod';
import { Add_Character_ZOD } from './characterZOD';
import { Add_Company_ZOD } from './companyZOD';
import { Add_Groupe_ZOD } from './groupeZOD';
import {
  Create_Link_ZOD,
  MediaDate_validation,
  MediaTitle_validation
} from './media';
import { Add_Person_ZOD } from './personZOD';
import { Add_Track_ZOD } from './trackZOD';
import { zodBoolean, zodNumber } from './util';
import { Add_Image_ZOD } from './imageZOD';

export const Manga_Pagination_ZOD = z
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
        name: z.string().optional()
      })
      .partial()
      .strict(),
    with: z
      .object({
        groupe: z.boolean().optional(),
        parent: z.boolean().optional(),
        source: z.boolean().optional(),
        staffs: z.boolean().optional(),
        companys: z.boolean().optional(),
        characters: z.boolean().optional()
      })
      .partial()
      .strict()
  })
  .partial()
  .strict();

export type IManga_Pagination_ZOD = z.infer<typeof Manga_Pagination_ZOD>;

const Manga_ChapterVolume_ZOD = z.object({
  airing: z.optional(zodNumber()),
  nextAiringDate: z.optional(z.string()),
  total: z.optional(zodNumber())
});

export const Add_Manga_ZOD = z.object({
  id: z.string().optional(),
  parentLabel: z.optional(z.enum(MediaParentLabelArray)),
  sourceLabel: z.optional(z.enum(MediaSourceArray))
}).partial();

export type IAdd_Manga_ZOD = z.infer<typeof Add_Manga_ZOD>;

export const Create_Manga_ZOD = z
  .object({
    groupe: Add_Groupe_ZOD,
    parent: z.optional(Add_Manga_ZOD),
    source: z.optional(Add_Manga_ZOD),
    title: MediaTitle_validation,
    date: z.optional(MediaDate_validation),
    cover: z.optional(Add_Image_ZOD),
    banner: z.optional(Add_Image_ZOD),
    synopsis: z.optional(z.string()),
    format: z.enum(MangaFormatArray),
    vf: z.optional(zodBoolean()),
    genres: z.optional(z.array(z.enum(MediaGenresArray))),
    // themes: z.optional(z.array(z.enum())),
    status: z.enum(MediaStatusArray),
    chapters: z.optional(Manga_ChapterVolume_ZOD),
    volumes: z.optional(Manga_ChapterVolume_ZOD),
    adult: zodBoolean(),
    explicit: zodBoolean(),
    links: z.optional(z.array(Create_Link_ZOD)),
    companys: z.optional(z.array(Add_Company_ZOD)),
    staffs: z.optional(z.array(Add_Person_ZOD)),
    characters: z.optional(z.array(Add_Character_ZOD)),
    tracks: z.optional(z.array(Add_Track_ZOD))
  })
  .strict();

export type ICreate_Manga_ZOD = z.infer<typeof Create_Manga_ZOD>;

export const MangaDataToZOD = (data: IManga): Partial<ICreate_Manga_ZOD> => {
  if (!data) return {};

  const toZOD: Partial<ICreate_Manga_ZOD> = {
    groupe: data.groupe,
    parent: data.parent,
    source: data.source,

    title: data.title,
    synopsis: data.synopsis,
    cover: data.cover,
    banner: data.banner,
    ...(data.date
      ? {
          date: {
            start: dateToZod(data.date.start),
            end: dateToZod(data.date.end)
          }
        }
      : {}),
    status: data.status,
    format: data.format,
    vf: data.vf || ('false' as any),
    ...(data.chapters
      ? {
          chapters: {
            ...data.chapters,
            nextAiringDate: dateTimeToZod(data.chapters.nextAiringDate)
          }
        }
      : {}),
    ...(data.volumes
      ? {
          volumes: {
            ...data.volumes,
            nextAiringDate: dateTimeToZod(data.volumes.nextAiringDate)
          }
        }
      : {}),
    adult: data.adult || ('false' as any),
    explicit: data.explicit || ('false' as any),
    genres: data.genres || [],
    links: data.links || [],
    companys: data.companys || [],
    staffs: data.staffs || [],
    characters: data.characters || []
  };

  const safeParse = Create_Manga_ZOD.safeParse(toZOD);

  if (safeParse.success) return safeParse.data;

  return toZOD;
};
