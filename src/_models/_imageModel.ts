import { model, Schema } from 'mongoose';
import { IImage } from '../_types/imageType';
import { genPublicID } from '../_utils/genID';
import { withSchema } from './_mediaModel';
import { TargetPathArray } from '../_utils/global';

const ImageSchema = new Schema<IImage>(
  {
    id: { type: String, default: () => genPublicID(5) },
    target: { type: withSchema, default: undefined },
    targetPath: { type: String, enum: TargetPathArray, required: true }
  },
  { timestamps: true, id: false, toJSON: { virtuals: true } }
);

ImageSchema.virtual('target.data', {
  ref: (doc: { targetPath: any }) => doc.targetPath,
  localField: 'target.id',
  foreignField: 'id',
  justOne: true
});

ImageSchema.virtual('url').get(function () {
  return `${process.env.WEBSITE_URL}/img/${this.targetPath}/${this.id}`;
});

export const ImageModel = model<IImage>('Image', ImageSchema);
