import { getModelForClass } from "@typegoose/typegoose";
import { ObjectType } from "type-graphql";
import { Anime, AnimeCustomQuery, AnimeSearchQuery } from "./_anime.type";
import { PaginationMedia } from "../../utils";
import { Media } from "../../utils/_media.base";
@ObjectType()
export class AnimeMedia extends Media<Anime>(Anime, AnimeSearchQuery.queryParse, AnimeSearchQuery.dynamicPopulate) { }
@ObjectType()
export class AnimeMediaPagination extends PaginationMedia(AnimeMedia) { }

export const AnimeModel = getModelForClass<typeof AnimeMedia, AnimeCustomQuery>(AnimeMedia, { schemaOptions: { toJSON: { virtuals: true } } });

