import { model, Schema as MongooseSchema } from 'mongoose';
import AutoIncrement from '../../lib/_autoIncrementPlugin';
import ICharacterSchema from './_interface';

export const Schema = new MongooseSchema<ICharacterSchema>({
    _id: Number,
    name: { romaji: String, french: String, english: String, native: String, alias: [String] },
    age: Number,
    image: String,
    dateOfBirth: Date,
    gender: String,
    species: String,
    description: String,
    actors: { type: [{ type: String, ref: 'person' }], default: undefined },
    createdAt: { type: Date, default: Date.now },
    editedAt: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false }
}, { _id: false })

export const dbName = 'characters';
export const rowName = dbName.slice(0, -1);

Schema.virtual('animes', {
    ref: 'anime',
    localField: '_id',
    foreignField: dbName + '.data',
});

Schema.virtual('mangas', {
    ref: 'manga',
    localField: '_id',
    foreignField: dbName + '.data',
});

Schema.virtual('updates', {
    ref: 'update',
    localField: '_id',
    foreignField: 'dataID',
});

Schema.virtual('contributors', {
    ref: 'user',
    localField: '_id',
    foreignField: 'contributions.data',
});

AutoIncrement.AutoIncrement(Schema, dbName, (id) => {
    console.log(dbName, 'un nouvel', rowName, "a été ajouté a l'id", id);
});

const Model = model(rowName, Schema, dbName);

export { Model };