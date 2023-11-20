import { Schema } from "mongoose";
import { AutoIncrementIds } from "../../lib/mongoosePlugin";
import { PersonInDB, PersonProps } from "./_Person.types";

export const PersonSchema = new Schema<PersonProps>({
    // _id: Number,
    // id: Number,
    name: {
        start: String,
        end: String,
        alias: [{ type: String }]
    },
    age: Number,
    birthDate: String,
    gender: String,
    bio: String,
    image: String,
    wikiUrl: String
});

const UpdateSchema = new Schema({
    data: PersonSchema,
    createdAt: Date,
    author: Number,
    moderator: Number,
    visible: Boolean,
    deletedReason: String,
    deletedAt: Date
})

const UpdateRequestSchema = new Schema({
    versionId: Number,
    data: PersonSchema,
    requestDate: Date,
    author: Number,
    status: String,
    rejectedReason: String,
    acceptNewUpdateFromAuthor: Boolean,
    deletedAt: Date
})

export const PersonSchemaV2 = new Schema<PersonInDB>({
    id: Number,
    updates: [UpdateSchema],
    updatesRequests: [UpdateRequestSchema],
    visible: Boolean
})

PersonSchemaV2.plugin(AutoIncrementIds.bind(null, 'personRequest'));