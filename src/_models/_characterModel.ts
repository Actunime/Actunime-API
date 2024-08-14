import { ICharacter } from '../_types/characterType';
import {
  CharacterGenderArray,
  CharacterRoleArray,
  CharacterSpeciesArray
} from '../_utils/characterUtil';
import { genPublicID } from '../_utils/genID';
import { Model, Schema, model, models } from 'mongoose';
import { withPersonSchema } from './_personModel';
import { withSchema } from './_mediaModel';

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
    avatar: { type: withSchema, default: undefined },
    actors: [{ type: withPersonSchema, default: undefined }]
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

export const CharacterModel = models.Character as Model<ICharacter> || model('Character', CharacterSchema);
