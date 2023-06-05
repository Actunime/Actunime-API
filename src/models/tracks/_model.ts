import { model, Schema as MongooseSchema } from 'mongoose';
import AutoIncrement from "../../autoIncrementPlugin";
import { ITrackSchema } from "./_interface";

export const Schema = new MongooseSchema<ITrackSchema>({
    type: String,
    name: String,
    artists: { type: [{ type: String, ref: 'person', _id: false }], default: undefined },
    links: { type: [{ name: String, value: String, _id: false }], default: undefined },
    episodes: { type: [{ type: Number, _id: false }], default: undefined },
    createdDate: Date,
    createdAt: Date,
    editedAt: Date,
    verified: { type: Boolean, default: false }
}, { _id: false })

export const dbName = 'tracks';
export const rowName = dbName.slice(0, -1);

Schema.virtual('animes', {
    ref: 'anime',
    localField: '_id',
    foreignField: dbName,
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