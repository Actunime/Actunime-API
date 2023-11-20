import { Schema } from "mongoose";
import { AutoIncrementIds } from "../../lib/mongoosePlugin";
import { TrackInDB, TrackProps } from "./_Track.types";


export const TrackSchema = new Schema<TrackProps>({
    // _id: Number,
    type: { type: String },
    name: String,
    artists: [{ type: Number }],
    links: [{ name: { type: String }, value: { type: String } }],
    createdDate: Date,
});


const UpdateSchema = new Schema({
    data: TrackSchema,
    createdAt: Date,
    author: Number,
    moderator: Number,
    visible: Boolean,
    deletedReason: String,
    deletedAt: Date
})

const UpdateRequestSchema = new Schema({
    versionId: Number,
    data: TrackSchema,
    requestDate: Date,
    author: Number,
    status: String,
    rejectedReason: String,
    acceptNewUpdateFromAuthor: Boolean,
    deletedAt: Date
})

export const TrackSchemaV2 = new Schema<TrackInDB>({
    id: Number,
    updates: [UpdateSchema],
    updatesRequests: [UpdateRequestSchema],
    visible: Boolean
})

TrackSchemaV2.plugin(AutoIncrementIds.bind(null, 'trackRequest'));