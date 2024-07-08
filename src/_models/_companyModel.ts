import { ICompany } from '../_types/companyType';
import { CompanyTypeArray } from '../_utils/companyUtil';
import { genPublicID } from '../_utils/genID';
import { Model, Schema, model, models } from 'mongoose';
import { MediaLinkSchema, withSchema } from './_mediaModel';

const CompanySchema = new Schema<ICompany>(
  {
    id: { type: String, default: () => genPublicID(5) },
    isVerified: { type: Boolean, default: false },
    isPreAdded: { type: Boolean, default: false },
    name: { type: String, required: true, unique: true, index: 'text' },
    type: { type: String, enum: CompanyTypeArray, default: undefined },
    links: { type: [MediaLinkSchema], default: undefined },
    images: { type: [withSchema], default: undefined },
    createdDate: { type: Date, default: undefined }
  },
  { timestamps: true, id: false }
);

export const withCompanySchema = new Schema(
  {
    id: { type: String }
  },
  { _id: false, toJSON: { virtuals: true } }
);

export const CompanyModel = models.Company as Model<ICompany> || model('Company', CompanySchema);
