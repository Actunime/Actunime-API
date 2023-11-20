import { model, Schema as MongooseSchema } from 'mongoose';
import AutoIncrement from "../../lib/_autoIncrementPlugin";
import { IMangaSchema } from "./_interface";

export const Schema = new MongooseSchema<IMangaSchema>({
    title: { romaji: String, french: String, english: String, native: String, alias: { type: [{ type: String, _id: false }], default: undefined } },
    date: { start: Date, end: Date },
    image: { poster: String, banner: String },
    description: String,
    source: String,
    format: String,
    tags: { type: [{ name: String, votes: [{ type: String, ref: 'user' }], spoil: Boolean, _id: false }], default: undefined },
    status: String,
    chapters: { airing: Number, nextAiringDate: { minDate: Date, maxDate: Date }, total: Number },
    volumes: { airing: Number, nextAiringDate: { minDate: Date, maxDate: Date }, total: Number },
    explicitContent: Boolean,
    links: { type: [{ name: String, value: String, _id: false }], default: undefined },
    producers: { type: [{ type: String, ref: 'company', _id: false }], default: undefined },
    relationsAnime: { type: [{ logic: String, data: { type: String, ref: 'anime' }, _id: false }], default: undefined },
    relationsManga: { type: [{ logic: String, data: { type: String, ref: 'manga' }, _id: false }], default: undefined },
    characters: { type: [{ type: { type: String }, data: { type: String, ref: 'character' }, _id: false }], default: undefined },
    staffs: { type: [{ type: String, ref: 'staff', _id: false }], default: undefined },
    createdAt: { type: Date, required: [true, "createdAt est requis."] },
    editedAt: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false }
}, { _id: false });

export const dbName = 'mangas';
export const rowName = dbName.slice(0, -1);

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