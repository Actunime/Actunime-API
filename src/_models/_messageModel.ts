import { genPublicID } from '../_utils/genID';
import { Schema, model } from 'mongoose';
import { IMessage } from '../_types/messageType';
import { TargetPathArray } from '../_utils/global';
import { withSchema } from './_mediaModel';

const MessageSchema = new Schema<IMessage>(
  {
    id: { type: String, default: () => genPublicID(5) },
    author: { type: withSchema, required: true },
    content: { type: String, required: true, trim: true },
    changes: { type: [{ content: String, at: Date }], default: [] },
    replyTo: { type: withSchema },
    target: { type: withSchema, default: undefined },
    targetPath: { type: String, enum: TargetPathArray, required: true },
    deleted: { type: Boolean, default: false },
    deletedBy: { type: withSchema, default: undefined },
    deletedAt: { type: Date, default: undefined }
  },
  { timestamps: true, id: false, toJSON: { virtuals: true } }
);

MessageSchema.virtual('target.data', {
  ref: (doc: { targetPath: any }) => doc.targetPath,
  localField: 'target.id',
  foreignField: 'id',
  justOne: true
});

MessageSchema.virtual('replys', {
  ref: 'Message',
  localField: 'replyTo.id',
  foreignField: 'id',
  justOne: true
});

export const MessageModel = model('Message', MessageSchema);
