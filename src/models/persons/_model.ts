import { model, Schema as MongooseSchema } from 'mongoose';
import AutoIncrement from "../../autoIncrementPlugin";
import { IPersonSchema } from "./_interface";

export const Schema = new MongooseSchema<IPersonSchema>({
    name: { first: String, end: String, alias: [String] },
    age: Number,
    dateOfBirth: Number,
    gender: String,
    bio: String,
    image: String,
    createdAt: { type: Date, default: Date.now },
    editedAt: { type: Date, default: undefined },
    verified: { type: Boolean, default: false }
}, { _id: false })

export const dbName = 'persons';
export const rowName = dbName.slice(0, -1);

Schema.virtual('characters', {
    ref: 'character',
    localField: '_id',
    foreignField: 'actors.data',
});

Schema.virtual('tracks', {
    ref: 'track',
    localField: '_id',
    foreignField: 'artists',
});

Schema.virtual('staffAnimes', {
    ref: 'anime',
    localField: '_id',
    foreignField: 'staffs',
});

Schema.virtual('staffMangas', {
    ref: 'manga',
    localField: '_id',
    foreignField: 'staffs',
});

Schema.virtual('updates', {
    ref: 'update',
    localField: '_id',
    foreignField: 'dataID',
});



AutoIncrement.AutoIncrement(Schema, dbName, (id) => {
    console.log(dbName, 'un nouvel', rowName, "a été ajouté a l'id", id);
});

const Model = model(rowName, Schema, dbName);

export { Model };