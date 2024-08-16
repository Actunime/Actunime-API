import { Model, model, models, Schema } from 'mongoose';
import { IImage } from '../_types/imageType';
import { genPublicID } from '../_utils/genID';
import { TargetPathArray } from '@/_utils/global';

export const withImage = new Schema(
  {
    id: { type: String, required: true }
  },
  { _id: false, toJSON: { virtuals: true } }
);

const ImageSchema = new Schema<IImage>(
  {
    id: { type: String, default: () => genPublicID(5) },
    // label: { type: String, enum: ImageLabelArray, required: true },
    targetPath: { type: String, enum: TargetPathArray, required: true },
    isVerified: { type: Boolean, default: false }
  },
  { timestamps: true, id: false, toJSON: { virtuals: true } }
);

ImageSchema.virtual('location').get(function () {
  return `/img/${this.targetPath?.toLocaleLowerCase()}/${this.id}.webp`;
});

const rootURL = `http://${process.env.HOST}:${process.env.PORT}`;

ImageSchema.virtual('url').get(function () {
  return `${rootURL}/${this.targetPath?.toLocaleLowerCase()}/${this.id}.webp`;
});

export const ImageModel = (models.Image as Model<IImage>) || model<IImage>('Image', ImageSchema);
