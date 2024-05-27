import { IManga, IMangaChapterVolums } from "../_types/mangaType";
import { genPublicID } from "../_utils/genID";
import { MangaFormatArray } from "../_utils/mangaUtil";
import {
  MediaParentLabelArray,
  MediaSourceArray,
  MediaStatusArray,
} from "../_utils/mediaUtil";
import { Model, Schema, model, models } from "mongoose";
import { withCharacterSchema } from "./_characterModel";
import { withCompanySchema } from "./_companyModel";
import { withGroupeSchema } from "./_groupeModel";
import {
  MediaDateSchema,
  MediaImageSchema,
  MediaLinkSchema,
  MediaTitleSchema,
} from "./_mediaModel";
import { withPersonSchema } from "./_personModel";

const MangaChapterVolumesSchema = new Schema<IMangaChapterVolums>({
  airing: { type: Number },
  nextAiringDate: { type: Date },
  total: { type: Number },
});

export const withMangaSchema = new Schema({
  id: { type: String, required: true },
  sourceLabel: {
    type: String,
    enum: MediaSourceArray,
    default: undefined,
  },
  parentLabel: {
    type: String,
    enum: MediaParentLabelArray,
    default: undefined,
  },
}, { _id: false, toJSON: { virtuals: true } });

const MangaSchema = new Schema<IManga>(
  {
    id: { type: String, default: () => genPublicID(5) },
    isVerified: { type: Boolean, default: false },
    isPreAdded: { type: Boolean, default: false },

    groupe: { type: withGroupeSchema, required: true },
    parent: { type: withMangaSchema, default: undefined },

    title: { type: MediaTitleSchema, required: true },
    date: { type: MediaDateSchema, default: undefined },
    image: { type: MediaImageSchema, default: undefined },
    synopsis: { type: String, default: undefined },
    source: { type: withMangaSchema, default: undefined },
    format: {
      type: String,
      enum: MangaFormatArray,
      default: undefined,
    },
    vf: { type: Boolean, default: undefined },
    genres: { type: [String], default: undefined },
    themes: { type: [String], default: undefined },
    status: { type: String, enum: MediaStatusArray },
    chapters: { type: MangaChapterVolumesSchema, default: undefined },
    volumes: { type: MangaChapterVolumesSchema, default: undefined },
    adult: { type: Boolean, default: undefined },
    explicit: { type: Boolean, default: undefined },
    links: { type: [MediaLinkSchema], default: undefined },

    companys: { type: [withCompanySchema], default: [] },
    staffs: { type: [withPersonSchema], default: [] },
    characters: { type: [withCharacterSchema], default: [] },
  },
  { timestamps: true, id: false }
);


MangaSchema.virtual("groupe.data", {
  ref: "Groupe",
  localField: "groupe.id",
  foreignField: "id",
  justOne: true,
})

MangaSchema.virtual('parent.data', {
  ref: "Manga",
  localField: "parent.id",
  foreignField: "id",
  justOne: true,
})

MangaSchema.virtual('source.data', {
  ref: "Manga",
  localField: "source.id",
  foreignField: "id",
  justOne: true,
})

MangaSchema.virtual('companys.data', {
  ref: "Company",
  localField: "companys.id",
  foreignField: "id",
  justOne: true,
})

MangaSchema.virtual('staffs.data', {
  ref: "Person",
  localField: "staffs.id",
  foreignField: "id",
  justOne: true,
})

MangaSchema.virtual('characters.data', {
  ref: "Character",
  localField: "characters.id",
  foreignField: "id",
  justOne: true,
})

MangaSchema.virtual('tracks.data', {
  ref: "Track",
  localField: "tracks.id",
  foreignField: "id",
  justOne: true,
})

export const MangaModel = model("Manga", MangaSchema);
