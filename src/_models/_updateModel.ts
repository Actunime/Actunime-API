import { IUpdate, IUpdateActionList } from '../_types/updateType';
import { genPublicID } from '../_utils/genID';
import { TargetPathArray } from '../_utils/global';
import { UpdateActionArray, UpdateStatusArray, UpdateTypeArray } from '../_utils/updateUtil';
import { Schema, model } from 'mongoose';
import { withSchema } from './_mediaModel';
import './_messageModel';

const UpdateActionListSchema = new Schema<IUpdateActionList>(
  {
    user: { type: withSchema, required: true },
    label: { type: String, enum: UpdateActionArray, default: undefined },
    note: { type: String, default: undefined },
    at: { type: Date, default: Date.now() }
  },
  { _id: false, toJSON: { virtuals: true } }
);

const UpdateSchema = new Schema<IUpdate>(
  {
    id: { type: String, unique: true, default: () => genPublicID(8) },
    type: { type: String, enum: UpdateTypeArray, required: true },
    actions: { type: [UpdateActionListSchema], default: [] },
    status: { type: String, enum: UpdateStatusArray, default: 'PENDING' },
    target: { type: withSchema, default: undefined },
    targetPath: { type: String, enum: TargetPathArray, required: true },
    ref: { type: withSchema, default: undefined },
    changes: { type: Schema.Types.Mixed, default: undefined },
    beforeChanges: { type: Schema.Types.Mixed, default: undefined },
    author: { type: withSchema }
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

UpdateSchema.virtual('target.data', {
  ref: (doc: { targetPath: any }) => doc.targetPath,
  localField: 'target.id',
  foreignField: 'id',
  justOne: true
});

UpdateSchema.virtual('ref.data', {
  ref: 'Update',
  localField: 'ref.id',
  foreignField: 'id',
  justOne: true
});

UpdateSchema.virtual('author.data', {
  ref: 'User',
  localField: 'author.id',
  foreignField: 'id',
  justOne: true
});

UpdateSchema.virtual('actions.user.data', {
  ref: 'User',
  localField: 'actions.user.id',
  foreignField: 'id',
  justOne: true
});

export const UpdateModel = model<IUpdate>('Update', UpdateSchema);
