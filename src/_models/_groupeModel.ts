import { IGroupe } from '../_types/groupeType';
import { genPublicID } from '../_utils/genID';
import { Schema, model } from 'mongoose';

const GroupeSchema = new Schema<IGroupe>(
  {
    id: { type: String, default: () => genPublicID(5) },
    isVerified: { type: Boolean, default: false },
    isPreAdded: { type: Boolean, default: false },
    name: { type: String, unique: true, required: true, index: 'text' }
  },
  { timestamps: true, id: false, toJSON: { virtuals: true } }
);

GroupeSchema.virtual('animes', {
  ref: 'Anime',
  localField: 'id',
  foreignField: 'groupe.id',
  justOne: false
});

GroupeSchema.virtual('mangas', {
  ref: 'Manga',
  localField: 'id',
  foreignField: 'groupe.id',
  justOne: false
});

export const withGroupeSchema = new Schema(
  {
    id: { type: String, required: true }
  },
  { _id: false, toJSON: { virtuals: true } }
);

export const GroupeModel = model('Groupe', GroupeSchema);
