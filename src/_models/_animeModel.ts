import { IAnime, IAnimeEpisode } from '../_types/animeType';
import { AnimeFormatArray } from '../_utils/animeUtil';
import { genPublicID } from '../_utils/genID';
import { MediaSourceArray, MediaStatusArray } from '../_utils/mediaUtil';
import { Model, Schema, model, models } from 'mongoose';
import { withCharacterSchema } from './_characterModel';
import { withCompanySchema } from './_companyModel';
import { withGroupeSchema } from './_groupeModel';
import { withMangaSchema } from './_mangaModel';
import {
  MediaDateSchema,
  MediaLinkSchema,
  MediaTitleSchema,
  withSchema
} from './_mediaModel';
import { withPersonSchema } from './_personModel';
import { withTrackSchema } from './_trackModel';

const AnimeEpisodeSchema = new Schema<IAnimeEpisode>(
  {
    airing: { type: Number },
    nextAiringDate: { type: Date },
    total: { type: Number },
    durationMinute: { type: Number }
  },
  { _id: false }
);

const withAnimeSchema = new Schema(
  {
    id: { type: String, required: true },
    sourceLabel: {
      type: String,
      enum: MediaSourceArray,
      default: undefined
    },
    parentLabel: {
      type: String,
      enum: ['SEQUEL', 'SPIN_OFF', 'ALTERNATIVE', 'REBOOT'],
      default: undefined
    }
  },
  { _id: false, toJSON: { virtuals: true } }
);

const AnimeSchema = new Schema<IAnime>(
  {
    id: { type: String, default: () => genPublicID(8) },
    isVerified: { type: Boolean, default: undefined },
    isPreAdded: { type: Boolean, default: undefined },
    groupe: { type: withGroupeSchema, required: true, default: undefined },
    parent: { type: withAnimeSchema, default: undefined },
    title: { type: MediaTitleSchema, required: true, default: undefined },
    date: { type: MediaDateSchema, default: undefined },
    images: { type: [withSchema], default: undefined },
    synopsis: { type: String, default: undefined },
    source: { type: withMangaSchema, default: undefined },
    format: { type: String, enum: AnimeFormatArray, required: true, default: undefined },
    vf: { type: Boolean, default: undefined },
    genres: { type: [String], default: undefined },
    // themes: { type: [String], default: undefined },
    status: { type: String, enum: MediaStatusArray, default: undefined },
    episodes: { type: AnimeEpisodeSchema, default: undefined },
    adult: { type: Boolean, default: undefined },
    explicit: { type: Boolean, default: undefined },
    links: { type: [MediaLinkSchema], default: undefined },
    companys: { type: [withCompanySchema], default: undefined },
    staffs: { type: [withPersonSchema], default: undefined },
    characters: { type: [withCharacterSchema], default: undefined },
    tracks: { type: [withTrackSchema], default: undefined }
  },
  { timestamps: true, id: false }
);

AnimeSchema.pre('aggregate', async function () {
  const animesNewEpisodes = await AnimeModel.find({
    'episodes.nextAiringDate': { $lt: new Date() }
  });

  for await (const anime of animesNewEpisodes) {
    if (anime.episodes?.nextAiringDate && anime.episodes?.nextAiringDate.getTime() < Date.now()) {
      if (anime.episodes?.airing !== undefined) {
        if (anime.episodes?.total !== undefined) {
          if (anime.episodes?.airing + 1 >= anime.episodes?.total) {
            anime.episodes.airing = anime.episodes?.total;
            anime.episodes.nextAiringDate = undefined;
            anime.status = 'ENDED';
            if (!anime.date) anime.date = {};
            anime.date.end = new Date();
          } else {
            anime.episodes.airing = anime.episodes?.airing + 1;
            anime.episodes.nextAiringDate = new Date(
              anime.episodes?.nextAiringDate.getTime() + 60000 * 60 * 24 * 7
            );
          }
        } else {
          // Créer un signalement system pour le fait qu'il y a pas de total d'épisode
          anime.episodes.airing = anime.episodes?.airing + 1;
          anime.episodes.nextAiringDate = new Date(
            anime.episodes?.nextAiringDate.getTime() + 60000 * 60 * 24 * 7
          );
        }
      } else {
        anime.episodes.airing = 0;

        if (anime.episodes?.total !== undefined) {
          if (anime.episodes.airing + 1 >= anime.episodes?.total) {
            anime.episodes.airing = anime.episodes?.total;
            anime.episodes.nextAiringDate = undefined;
            anime.status = 'ENDED';
            if (!anime.date) anime.date = {};
            anime.date.end = new Date();
          } else {
            anime.episodes.airing = anime.episodes?.airing + 1;
          }
        } else {
          // Créer un signalement system pour le fait qu'il y a pas de total d'épisode
          anime.episodes.airing = anime.episodes?.airing + 1;
          if (anime.episodes.nextAiringDate)
            anime.episodes.nextAiringDate = new Date(
              anime.episodes.nextAiringDate.getTime() + 60000 * 60 * 24 * 7
            );
          else {
            anime.episodes.nextAiringDate = new Date(Date.now() + 60000 * 60 * 24 * 7);
          }
        }
      }

      await anime.save();
    }
  }
});

AnimeSchema.virtual('groupe.data', {
  ref: 'Groupe',
  localField: 'groupe.id',
  foreignField: 'id',
  justOne: true
});

AnimeSchema.virtual('parent.data', {
  ref: 'Anime',
  localField: 'parent.id',
  foreignField: 'id',
  justOne: true
});

AnimeSchema.virtual('source.data', {
  ref: 'Manga',
  localField: 'source.id',
  foreignField: 'id',
  justOne: true
});

AnimeSchema.virtual('companys.data', {
  ref: 'Company',
  localField: 'companys.id',
  foreignField: 'id',
  justOne: true
});

AnimeSchema.virtual('staffs.data', {
  ref: 'Person',
  localField: 'staffs.id',
  foreignField: 'id',
  justOne: true
});

AnimeSchema.virtual('characters.data', {
  ref: 'Character',
  localField: 'characters.id',
  foreignField: 'id',
  justOne: true
});

AnimeSchema.virtual('tracks.data', {
  ref: 'Track',
  localField: 'tracks.id',
  foreignField: 'id',
  justOne: true
});

export const AnimeModel = models.Anime as Model<IAnime> || model<IAnime>('Anime', AnimeSchema);
