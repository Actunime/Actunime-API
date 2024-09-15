import {
  MediaGenresArray,
  MediaParentLabelArray,
  MediaStatusArray,
  dateTimeToZod,
  dateToZod
} from '../_utils/mediaUtil';
import { z } from 'zod';
import { Add_Character_ZOD } from './characterZOD';
import { Add_Company_ZOD } from './companyZOD';
import { Add_Groupe_ZOD } from './groupeZOD';
import { Add_Manga_ZOD } from './mangaZOD';
import {
  Create_Link_ZOD,
  MediaDate_validation,
  MediaImage_validation,
  MediaTitle_validation
} from './media';
import { Add_Person_ZOD } from './personZOD';
import { Add_Track_ZOD } from './trackZOD';
import { zodBoolean, zodNumber } from './util';
import { AnimeFormatArray } from '../_utils/animeUtil';
import { IAnime } from '../_types/animeType';
import { Add_Image_ZOD } from './imageZOD';

export const Anime_Pagination_ZOD = z
  .object({
    page: zodNumber(),
    limit: zodNumber(),
    strict: z.boolean().optional(),
    sort: z
      .object({
        'episodes.nextAiringDate': z.enum(['DESC', 'ASC']).optional(),
        updaptedAt: z.enum(['DESC', 'ASC']).optional(),
        createdAt: z.enum(['DESC', 'ASC']).optional()
      })
      .partial()
      .strict(),
    query: z
      .object({
        name: z.string().optional(),
        status: z.string().optional(),
        genres: z.array(z.string()).optional()
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
        characters: z.boolean().optional(),
        tracks: z.boolean().optional(),
        cover: z.boolean().optional(),
        banner: z.boolean().optional()
      })
      .partial()
      .strict()
  })
  .partial()
  .strict();

export type IAnime_Pagination_ZOD = z.infer<typeof Anime_Pagination_ZOD>;

const Anime_Episode_ZOD = z.object({
  airing: z.optional(zodNumber()),
  nextAiringDate: z.optional(z.string()),
  total: z.optional(zodNumber()),
  durationMinute: z.optional(zodNumber())
});

export const Add_Anime_ZOD = z
  .object({
    id: z.string().optional(),
    parentLabel: z.optional(z.enum(MediaParentLabelArray))
  })
  .partial();

export type IAdd_Anime_ZOD = z.infer<typeof Add_Anime_ZOD>;

export const Create_Anime_ZOD = z
  .object({
    groupe: Add_Groupe_ZOD,
    parent: z.optional(Add_Anime_ZOD),
    source: z.optional(Add_Manga_ZOD),
    title: MediaTitle_validation,
    date: z.optional(MediaDate_validation),
    cover: z.optional(Add_Image_ZOD),
    banner: z.optional(Add_Image_ZOD),
    synopsis: z.optional(z.string()),
    format: z.enum(AnimeFormatArray),
    vf: z.optional(zodBoolean()),
    genres: z.optional(z.array(z.enum(MediaGenresArray))),
    // themes: z.optional(z.array(z.string())),
    status: z.enum(MediaStatusArray),
    episodes: z.optional(Anime_Episode_ZOD),
    adult: zodBoolean(),
    explicit: zodBoolean(),
    links: z.optional(z.array(Create_Link_ZOD)),
    companys: z.optional(z.array(Add_Company_ZOD)),
    staffs: z.optional(z.array(Add_Person_ZOD)),
    characters: z.optional(z.array(Add_Character_ZOD)),
    tracks: z.optional(z.array(Add_Track_ZOD))
  })
  .strict();

// export const Create_Anime_ZOD = z
//   .object({
//     groupe: Add_Groupe_ZOD,
//     parent: z.optional(Add_Anime_ZOD.partial()),
//     source: z.optional(Add_Manga_ZOD.partial()),
//     title: MediaTitle_validation,
//     date: z.optional(MediaDate_validation),
//     image: z.optional(MediaImage_validation),
//     synopsis: z.optional(z.string()),
//     format: z.enum(AnimeFormatArray),
//     vf: z.optional(zodBoolean()),
//     genres: z.optional(z.array(z.enum(MediaGenresArray))),
//     // themes: z.optional(z.array(z.string())),
//     status: z.enum(MediaStatusArray),
//     episodes: z.optional(Anime_Episode_ZOD),
//     adult: zodBoolean(),
//     explicit: zodBoolean(),
//     links: z.optional(z.array(Create_Link_ZOD)),
//     companys: z.optional(z.array(Add_Company_ZOD)),
//     persons: z.optional(z.array(Add_Person_ZOD)),
//     characters: z.optional(z.array(Add_Character_ZOD)),
//     tracks: z.optional(z.array(Add_Track_ZOD))
//   })
//   .strict()
//   .refine(
//     (data) => {
//       if (data.parent?.id) {
//         if (!data.parent.parentLabel) {
//           return false;
//         }
//       }
//       const status = data.status;

//       if (status && !['SOON', 'any'].includes(status)) {
//         if (!data.episodes?.airing) {
//           return false;
//         }
//         if (!data.episodes?.durationMinute) {
//           return false;
//         }
//         if (status === 'AIRING' && !data.episodes?.nextAiringDate) {
//           return false;
//         }
//         if (!data.episodes?.total) {
//           return false;
//         }
//       }
//       return true;
//     },
//     (data) => {
//       if (data.parent?.id) {
//         if (!data.parent?.parentLabel) {
//           return {
//             message: 'Ce champ est obligatoire si vous avez spécifié un parent.',
//             path: ['parentLabel']
//           };
//         }
//       }
//       const status = data.status;

//       if (status && !['SOON', 'any'].includes(status)) {
//         const message = `Le statut spécifié est: "${MediaStatusObj[status].label}", alors remplir ce champ est obligatoire !`;
//         if (!data.episodes?.airing) {
//           return {
//             message,
//             path: ['episodes.airing']
//           };
//         }
//         if (!data.episodes?.durationMinute) {
//           return {
//             message,
//             path: ['episodes.durationMinute']
//           };
//         }
//         if (status === 'AIRING' && !data.episodes?.nextAiringDate) {
//           return {
//             message,
//             path: ['episodes.nextEpisodeDate']
//           };
//         }
//         if (!data.episodes?.total) {
//           return {
//             message,
//             path: ['episodes.total']
//           };
//         }
//       }

//       return {
//         message: 'Nous avons un problème.',
//         path: ['CreateAnime']
//       };
//     }
//   );

export type ICreate_Anime_ZOD = z.infer<typeof Create_Anime_ZOD>;

export const PreCreateAnime_validation = z.object({
  title: MediaTitle_validation
});

export const Create_Anime_Update_ZOD = z.object({
  groupe: z.optional(Add_Groupe_ZOD),
  parent: z.optional(Add_Anime_ZOD),
  parentPath: z.optional(z.enum(['Anime', 'Manga'])),
  title: z.optional(MediaTitle_validation),
  date: z.optional(MediaDate_validation),
  image: z.optional(MediaImage_validation),
  synopsis: z.optional(z.string()),
  source: z.string().optional(),
  sourcePath: z.optional(z.enum(['Anime', 'Manga'])),
  format: z.optional(z.enum(AnimeFormatArray)),
  vf: z.optional(z.boolean()),
  genres: z.optional(z.array(z.string())),
  themes: z.optional(z.array(z.string())),
  status: z.optional(z.enum(MediaStatusArray)),
  episodes: z.optional(Anime_Episode_ZOD),
  adult: z.optional(z.boolean()),
  explicit: z.optional(z.boolean()),
  links: z.optional(z.array(Create_Link_ZOD)),
  companys: z.optional(z.array(Add_Company_ZOD)),
  staffs: z.optional(z.array(Add_Person_ZOD)),
  characters: z.optional(z.array(Add_Character_ZOD)),
  tracks: z.optional(z.array(Add_Track_ZOD))
});

export const AnimeDataToZOD = (data: IAnime): Partial<ICreate_Anime_ZOD> => {
  if (!data) return {};

  const toZOD: Partial<ICreate_Anime_ZOD> = {
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
    vf: data.vf,
    ...(data.episodes
      ? {
          episodes: {
            ...data.episodes,
            nextAiringDate: dateTimeToZod(data.episodes.nextAiringDate)
          }
        }
      : {}),
    adult: data.adult,
    explicit: data.explicit,
    genres: data.genres || [],
    links: data.links || [],
    companys: data.companys || [],
    staffs: data.staffs || [],
    characters: data.characters || [],
    tracks: data.tracks || []
  };

  const safeParse = Create_Anime_ZOD.safeParse(toZOD);

  if (safeParse.success) return safeParse.data;

  return toZOD;
};
