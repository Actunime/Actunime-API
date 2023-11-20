import { model, Schema as MongooseSchema } from 'mongoose';
import AutoIncrement from '../../lib/_autoIncrementPlugin';
import { CharacterRequestModel, CharacterRequestProps } from './_interfaces';

export const CharacterRequestSchema = new MongooseSchema<CharacterRequestModel>({
    _id: Number,
    name: { first: String, end: String, alias: [String] },
    age: Number,
    image: String,
    birthDate: Date,
    gender: String,
    species: String,
    bio: String,
    actors: { type: [{ type: String, ref: 'person' }], default: undefined },
    createdAt: { type: Date, default: Date.now },
    editedAt: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false }
}, { _id: false })

export const dbName = 'charactersRequest';
export const rowName = dbName.slice(0, -1);

CharacterRequestSchema.virtual('animes', {
    ref: 'anime',
    localField: '_id',
    foreignField: dbName + '.data',
});

CharacterRequestSchema.virtual('mangas', {
    ref: 'manga',
    localField: '_id',
    foreignField: dbName + '.data',
});

CharacterRequestSchema.virtual('updates', {
    ref: 'update',
    localField: '_id',
    foreignField: 'dataID',
});

CharacterRequestSchema.virtual('contributors', {
    ref: 'user',
    localField: '_id',
    foreignField: 'contributions.data',
});

AutoIncrement.AutoIncrement(CharacterRequestSchema, dbName, (id) => {
    console.log(dbName, 'un nouvel', rowName, "a été ajouté a l'id", id);
});

const CharacterRequestModel = model(rowName, CharacterRequestSchema, dbName);

export { CharacterRequestModel };