import { model, Schema as MongooseSchema } from 'mongoose';
import AutoIncrement from "../../autoIncrementPlugin";
import { IUpdateSchema } from "./_interface";

export const Schema = new MongooseSchema<IUpdateSchema>({
    _id: { type: Number },
    action: { type: String, required: true },
    status: { type: String, required: true },
    dbName: { type: String, required: true },
    user: { type: String, ref: 'user', required: false },
    data: { type: Number, required: true, refPath: 'dbName' },
    changes: { type: MongooseSchema.Types.Mixed, default: undefined },
    dataDeleted: { type: Boolean, default: false },
    reason: { type: String, default: undefined },
    userTextInfo: { type: String, default: undefined },
    ref: { type: Number, ref: 'update', default: undefined },
    moderator: { type: Number, ref: 'user', default: undefined },
    createdAt: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false }
}, { _id: false, toJSON: { virtuals: true } })

export const dbName = 'updates';
export const rowName = dbName.slice(0, -1);

Schema.virtual('references', {
    ref: 'update',
    localField: '_id',
    foreignField: 'ref',
});


AutoIncrement.AutoIncrement(Schema, dbName);

const Model = model(rowName, Schema, dbName);

export { Model };
export default Model;