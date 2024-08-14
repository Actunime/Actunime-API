import { IPatch } from '../_types/patchType';
import { genPublicID } from '../_utils/genID';
import { TargetPathArray } from '../_utils/global';
import { PatchStatusArray, PatchTypeArray } from '../_utils/patchUtil';
import { Model, Schema, model, models } from 'mongoose';
import { withSchema } from './_mediaModel';

const PatchSchema = new Schema<IPatch>(
  {
    id: { type: String, unique: true, default: () => genPublicID(8) },
    type: { type: String, enum: PatchTypeArray, required: true },
    note: { type: String, default: undefined },
    status: { type: String, enum: PatchStatusArray, default: 'PENDING' },
    target: { type: withSchema, default: undefined },
    targetPath: { type: String, enum: TargetPathArray, required: true },
    ref: { type: withSchema, default: undefined },
    newValues: { type: Schema.Types.Mixed, default: undefined },
    oldValues: { type: Schema.Types.Mixed, default: undefined },
    author: { type: withSchema },
    currentModerator: { type: withSchema, default: undefined },
  },
  { timestamps: true, id: false, toJSON: { virtuals: true } }
);

PatchSchema.virtual('target.data', {
  ref: (doc: { targetPath: any }) => doc.targetPath,
  localField: 'target.id',
  foreignField: 'id',
  justOne: true
});

PatchSchema.virtual('ref.data', {
  ref: 'Patch',
  localField: 'ref.id',
  foreignField: 'id',
  justOne: true
});

PatchSchema.virtual('author.data', {
  ref: 'User',
  localField: 'author.id',
  foreignField: 'id',
  justOne: true
});

PatchSchema.virtual('currentModerator.data', {
  ref: 'User',
  localField: 'author.id',
  foreignField: 'id',
  justOne: true
});


export const PatchModel = models.Patch as Model<IPatch> || model<IPatch>('Patch', PatchSchema);
