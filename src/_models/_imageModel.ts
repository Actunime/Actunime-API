import { model, Schema } from 'mongoose';
import { IImage } from '../_types/imageType';
import { genPublicID } from '../_utils/genID';
import { ImageLabelArray } from '../_utils/imageUtil';

const ImageSchema = new Schema<IImage>(
  {
    id: { type: String, default: () => genPublicID(5) },
    label: { type: String, enum: ImageLabelArray, required: true },
    // target: { type: withSchema, default: undefined },
    // targetPath: { type: String, enum: TargetPathArray, required: true }
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true, id: false, toJSON: { virtuals: true } }
);

// ImageSchema.virtual('target.data', {
//   ref: (doc: { targetPath: any }) => doc.targetPath,
//   localField: 'target.id',
//   foreignField: 'id',
//   justOne: true
// });

ImageSchema.virtual('url').get(function () {
  return `${process.env.WEBSITE_URL}/img/${this.id}`;
});

export const ImageModel = model<IImage>('Image', ImageSchema);
