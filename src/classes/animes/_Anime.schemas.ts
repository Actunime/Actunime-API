import { model, Schema } from "mongoose"
import { AnimeRequestClass } from "./AnimeRequest.class";
import { AutoIncrementIds } from "../../lib/mongoosePlugin";
import { AnimeInDB, AnimeProps } from "./_Anime.types";



// export const AnimeSchema = new Schema<AnimeClassProps>();
// export const AnimeModel = model('anime', AnimeSchema, 'animes');

export const AnimeSchema = new Schema<AnimeProps>({
    // id: Number,
    title: Object,
    date: Object,
    image: Object,
    synopsis: String,
    source: String,
    format: String,
    genres: [{ type: String }],
    themes: [{ type: String }],
    status: String,
    episodes: Object,
    adult: Boolean,
    explicit: Boolean,
    links: [{ type: Object }],
    companys: [{ type: Number }],
    staffs: [{ type: Object }],
    characters: [{ type: Object }],
    tracks: [{ type: Object }]
});


const UpdateSchema = new Schema({
    data: AnimeSchema,
    createdAt: Date,
    author: Number,
    moderator: Number,
    visible: Boolean,
    deletedReason: String,
    deletedAt: Date
})

const UpdateRequestSchema = new Schema({
    versionId: Number,
    data: AnimeSchema,
    requestDate: Date,
    author: Number,
    status: String,
    rejectedReason: String,
    acceptNewUpdateFromAuthor: Boolean,
    deletedAt: Date
})

export const AnimeSchemaV2 = new Schema<AnimeInDB>({
    id: Number,
    updates: [UpdateSchema],
    updatesRequests: [UpdateRequestSchema],
    visible: Boolean
})

// let x = model('x', AnimeSchemaV2, 'xs');

// (async() => {
//     let a = await x.findOne();
//     a?.populate({path: 'update.data.company', })
//     a?.updates.map((update) => {
//         update.data.
//     })
// })

AnimeSchemaV2.plugin(AutoIncrementIds.bind(null, 'animeRequest'))