import { IPatch, IPatchActionList } from '../_types/patchType';
import { genPublicID } from '../_utils/genID';
import { TargetPathArray } from '../_utils/global';
import { PatchActionArray, PatchStatusArray, PatchTypeArray } from '../_utils/patchUtil';
import { Schema, model } from 'mongoose';
import { withSchema } from './_mediaModel';

const PatchActionListSchema = new Schema<IPatchActionList>(
  {
    user: { type: withSchema, required: true },
    label: { type: String, enum: PatchActionArray, default: undefined },
    note: { type: String, default: undefined },
    at: { type: Date, default: Date.now() }
  },
  { _id: false, toJSON: { virtuals: true } }
);

const PatchSchema = new Schema<IPatch>(
  {
    id: { type: String, unique: true, default: () => genPublicID(8) },
    type: { type: String, enum: PatchTypeArray, required: true },
    actions: { type: [PatchActionListSchema], default: [] },
    status: { type: String, enum: PatchStatusArray, default: 'PENDING' },
    target: { type: withSchema, default: undefined },
    targetPath: { type: String, enum: TargetPathArray, required: true },
    ref: { type: withSchema, default: undefined },
    changes: { type: Schema.Types.Mixed, default: undefined },
    beforeChanges: { type: Schema.Types.Mixed, default: undefined },
    author: { type: withSchema }
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

PatchSchema.virtual('actions.user.data', {
  ref: 'User',
  localField: 'actions.user.id',
  foreignField: 'id',
  justOne: true
});

export const PatchModel = model<IPatch>('Patch', PatchSchema);
