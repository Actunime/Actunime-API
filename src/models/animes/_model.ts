import { model, Schema as MongooseSchema } from 'mongoose';
import AutoIncrement from '../../autoIncrementPlugin';
import { IAnimeSchema } from './_interface';

export const Schema = new MongooseSchema<IAnimeSchema>({
    _id: Number,

    title: {
        romaji: {
            type: String,
            required: [true, "Le titre en romaji est obligatoire."],
            validate: {
                validator: async (value: string) => {
                    const Model = model('anime', Schema, 'animes');
                    let exist = await Model.exists({ 'title.romaji': value.trim() });
                    return exist ? false : true;
                },
                message: `Le titre en romaji est déjà utilisé par un autre anime.`
            }
        },
        french: {
            type: String,
            validate: {
                validator: async (value: string) => {
                    const Model = model('anime', Schema, 'animes');
                    let exist = await Model.exists({ 'title.french': value.trim() });
                    return exist ? false : true;
                },
                message: `Le titre en français est déjà utilisé par un autre anime.`
            }
        },
        english: {
            type: String,
            validate: {
                validator: async (value: string) => {
                    const Model = model('anime', Schema, 'animes');
                    let exist = await Model.exists({ 'title.french': value.trim() });
                    return exist ? false : true;
                },
                message: `Le titre en anglais est déjà utilisé par un autre anime.`
            }
        },
        native: {
            type: String,
            validate: {
                validator: async (value: string) => {
                    const Model = model('anime', Schema, 'animes');
                    let exist = await Model.exists({ 'title.french': value.trim() });
                    return exist ? false : true;
                },
                message: `Le titre natif est déjà utilisé par un autre anime.`
            }
        },
        alias: { type: [{ type: String, _id: false }], default: undefined }
    },

    date: { start: Date, end: Date },

    image: {
        poster: {
            type: String,
            // validate: {
            //     validator: async (value: string) => {
            //         return /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_\+.~#?&\/\/=]*)/.test(value)
            //     },
            //     message: `Le lien de l'affiche est incorrecte.`
            // }
        },
        banner: {
            type: String,
            // validate: [
            //     {
            //         validator: async (value: string) => {
            //             return /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_\+.~#?&\/\/=]*)/.test(value)
            //         },
            //         message: `Le lien de la bannière est incorrecte.`
            //     }
            // ]
        }
    },

    description: {
        type: String,
        validate: [
            {
                validator: (value: string) => {
                    return /<[^>]*>/.test(value);
                },
                message: `La description ne doit pas contenir de balise HTML (anti injection).`
            },
            {
                validator: (value: string) => {
                    return /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_\+.~#?&\/\/=]*)/.test(value);
                },
                message: `La description ne doit pas contenir de lien.`
            }
        ]
    },

    source: String,

    format: String,

    tags: { type: [{ name: String, votes: [{ type: String, ref: 'user' }], spoil: Boolean, _id: false }], default: undefined },

    status: {
        type: String,
        require: [true, "Le statut de diffusion est obligatoire."]
    },

    episodes: { airing: Number, nextAiringDate: Date, total: Number },

    explicitContent: Boolean,

    links: {
        type: [
            {
                name: {
                    type: String,
                    required: [true, "Le lien require un nom."]
                },
                value: {
                    type: String,
                    required: [true, "Vous devez préciser le lien."]
                },
                _id: false
            }
        ],
        default: undefined
    },

    studios: { type: [{ type: Number, ref: 'company' }], default: undefined },

    producers: { type: [{ type: Number, ref: 'company' }], default: undefined },

    relationsAnime: { type: [{ label: String, data: { type: Number, ref: 'anime' }, _id: false }], default: undefined },

    relationsManga: { type: [{ label: String, data: { type: Number, ref: 'manga' }, _id: false }], default: undefined },

    characters: { type: [{ label: { type: String }, data: { type: Number, ref: 'character' }, _id: false }], default: undefined },

    tracks: { type: [{ label: { type: String }, data: { type: Number, ref: 'track' }, _id: false }], default: undefined },

    staffs: { type: [{ label: { type: String }, data: { type: Number, ref: 'person' }, _id: false }], default: undefined },

    createdAt: { type: Date, default: Date.now },

    editedAt: { type: Date, default: Date.now },

    verified: { type: Boolean, default: false }

}, { _id: false });

const dbName = 'animes';
const rowName = dbName.slice(0, -1);

Schema.virtual('updates', {
    ref: 'update',
    localField: '_id',
    foreignField: 'dataID',
});

AutoIncrement.AutoIncrement(Schema, dbName);

const Model = model(rowName, Schema, dbName);

export { Model };