import { ICharacter } from '../_types/characterType';
import {
  CharacterGenderArray,
  CharacterRoleArray,
  CharacterSpeciesArray
} from '../_utils/characterUtil';
import { genPublicID } from '../_utils/genID';
import { Schema, model } from 'mongoose';
import { withPersonSchema } from './_personModel';

const CharacterSchema = new Schema<ICharacter>(
  {
    id: { type: String, default: () => genPublicID(5) },
    isVerified: { type: Boolean, default: false },
    isPreAdded: { type: Boolean, default: false },
    name: { first: String, last: String, alias: [String] },
    age: Number,
    birthDate: Date,
    gender: {
      type: String,
      enum: CharacterGenderArray,
      required: true
    },
    species: {
      type: String,
      enum: CharacterSpeciesArray,
      required: true
    },
    bio: String,
    image: String,
    actors: [{ type: withPersonSchema, default: [] }]
  },
  { timestamps: true, id: false, toJSON: { virtuals: true } }
);

CharacterSchema.virtual('name.full').get(function () {
  return `${this.name.first} ${this.name.last || ''}`.trim();
});

export const withCharacterSchema = new Schema(
  {
    id: { type: String, required: true },
    role: { type: String, enum: CharacterRoleArray }
  },
  { _id: false, toJSON: { virtuals: true } }
);

CharacterSchema.virtual('actors.data', {
  ref: 'Person',
  localField: 'actors.id',
  foreignField: 'id',
  justOne: true
});

export const CharacterModel = model('Character', CharacterSchema);
