import { IActivity } from '../_types/activityType';
import { ActivityActionArray } from '../_utils/activityUtil';
import { genPublicID } from '../_utils/genID';
import { TargetPathArray } from '../_utils/global';
import { Model, Schema, model, models } from 'mongoose';
import { withSchema } from './_mediaModel';

const withTargetSchema = new Schema(
  {
    id: { type: String, required: true }
  },
  { _id: false, toJSON: { virtuals: true } }
);

const ActivitySchema = new Schema<IActivity>(
  {
    id: { type: String, default: () => genPublicID(8) },
    type: {
      type: String,
      enum: ['PUBLIC', 'MEMBER', 'MODERATION'],
      required: true
    },
    action: {
      type: String,
      enum: ActivityActionArray,
      required: true
    },
    author: { type: withSchema, default: undefined },
    target: { type: withTargetSchema, default: undefined },
    targetPath: {
      type: String,
      enum: TargetPathArray,
      required: true
    },
    changes: { type: Object, default: undefined },
    params: { type: Object, default: undefined }
  },
  { timestamps: true, id: false }
);

export const ActivityModel = models.Activity as Model<IActivity> || model('Activity', ActivitySchema);