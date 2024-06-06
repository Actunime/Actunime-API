import { IPerson } from '../_types/personType';
import { genPublicID } from '../_utils/genID';
import { PersonRoleArray } from '../_utils/personUtil';
import { Schema, model } from 'mongoose';
import { MediaLinkSchema } from './_mediaModel';

const PersonSchema = new Schema<IPerson>(
  {
    id: { type: String, default: () => genPublicID(5) },
    isVerified: { type: Boolean, default: false },
    isPreAdded: { type: Boolean, default: false },
    name: {
      first: { type: String, required: true },
      last: { type: String, required: true },
      alias: [String]
    },
    birthDate: { type: Date, default: undefined },
    deathDate: { type: Date, default: undefined },
    bio: String,
    image: String,
    links: { type: [MediaLinkSchema], default: undefined }
  },
  { timestamps: true, id: false, toJSON: { virtuals: true } }
);

PersonSchema.virtual('name.full').get(function () {
  return `${this.name.first} ${this.name.last || ''}`.trim();
});

export const withPersonSchema = new Schema(
  {
    id: { type: String, required: true },
    role: { type: String, enum: PersonRoleArray, default: undefined }
  },
  { _id: false, toJSON: { virtuals: true } }
);

export const PersonModel = model('Person', PersonSchema, 'persons');
