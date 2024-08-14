import { IReport } from '../_types/reportType';
import { genPublicID } from '../_utils/genID';
import { TargetPathArray } from '../_utils/global';
import { ReportStatusArray, ReportSubjectArray } from '../_utils/reportUtil';
import { Model, Schema, model, models } from 'mongoose';

const ReportSchema = new Schema<IReport>(
  {
    id: { type: String, default: () => genPublicID(8) },
    status: {
      type: String,
      enum: ReportStatusArray,
      default: 'PENDING'
    },
    by: { type: Schema.Types.ObjectId, ref: 'User' },
    target: {
      type: Schema.Types.ObjectId,
      refPath: 'targetPath',
      default: undefined,
      required: true
    },
    targetPath: {
      type: String,
      enum: TargetPathArray,
      required: true
    },
    subject: { type: String, enum: ReportSubjectArray, required: true },
    message: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true, id: false }
);

export const ReportModel = models.Report as Model<IReport> || model('Report', ReportSchema);
