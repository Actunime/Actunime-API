import { Schema } from "mongoose";
import { AutoIncrementIds } from "../../lib/mongoosePlugin";
import { CharacterInDB, CharacterProps } from "./_Character.types";


export const CharacterSchema = new Schema<CharacterProps>({
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
    species: String,
    bio: String,
    image: String,
    actors: [{ type: Number }]
});


const UpdateSchema = new Schema({
    data: CharacterSchema,
    createdAt: Date,
    author: Number,
    moderator: Number,
    visible: Boolean,
    deletedReason: String,
    deletedAt: Date
})

const UpdateRequestSchema = new Schema({
    versionId: Number,
    data: CharacterSchema,
    requestDate: Date,
    author: Number,
    status: String,
    rejectedReason: String,
    acceptNewUpdateFromAuthor: Boolean,
    deletedAt: Date
})

export const CharacterSchemaV2 = new Schema<CharacterInDB>({
    id: Number,
    updates: [UpdateSchema],
    updatesRequests: [UpdateRequestSchema],
    visible: Boolean
})


CharacterSchemaV2.plugin(AutoIncrementIds.bind(null, 'characterRequest'))