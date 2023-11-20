import { model, Schema as MongooseSchema } from 'mongoose';
import AutoIncrement from "../../lib/_autoIncrementPlugin";
import { ICompanySchema } from "./_interface";


export const Schema = new MongooseSchema<ICompanySchema>({
    _id: Number,
    label: { type: String, required: [true, "Le type de société est requis"] },
    name: { type: String, required: [true, "Le nom du studio est requis."] },
    siteUrl: {
        type: String, required: [true, "Le site officiel du studio est requis."],
        validate: {
            validator: (e: string) => {
                return /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_\+.~#?&\/\/=]*)/.test(e)
            },
            message: "Le lien du site officiel est incorrecte."
        }
    },
    createdDate: { type: Date },
    createdAt: { type: Date, default: Date.now },
    editedAt: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false }
}, { _id: false })

export const dbName = 'companys';
export const rowName = dbName.slice(0, -1);

Schema.virtual('animeCompanys', {
    ref: 'anime',
    localField: '_id',
    foreignField: 'companys',
});

// Schema.virtual('animeProducers', {
//     ref: 'anime',
//     localField: '_id',
//     foreignField: 'producers',
// });

// Schema.virtual('mangaCompanys', {
//     ref: 'manga',
//     localField: '_id',
//     foreignField: 'companys',
// });

Schema.virtual('updates', {
    ref: 'update',
    localField: '_id',
    foreignField: 'dataID',
});

AutoIncrement.AutoIncrement(Schema, dbName);


const Model = model(rowName, Schema, dbName);

export { Model };