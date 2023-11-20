import { model } from "mongoose";
import { AnimeSchema, AnimeSchemaV2 } from "./_Anime.schemas";


export const AnimeModel = model('animeRequest', AnimeSchemaV2, 'animeRequests');