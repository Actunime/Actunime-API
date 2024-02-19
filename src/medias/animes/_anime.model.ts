import { getModelForClass } from "@typegoose/typegoose";
import { ObjectType } from "type-graphql";
import { Anime, AnimeCustomQuery, AnimeSearchQuery } from "./_anime.type";
import { PaginationOutput } from "../../utils";
import { Media } from "../../utils/_media.base";
@ObjectType()
export class AnimePaginationOutput extends PaginationOutput<Anime>(Anime) { }

@ObjectType()
export class AnimeMedia extends Media<Anime>(Anime, AnimeSearchQuery.queryParse) { }

export const AnimeModel = getModelForClass<typeof AnimeMedia, AnimeCustomQuery>(AnimeMedia, { schemaOptions: { toJSON: { virtuals: true } } });
@ObjectType()
export class AnimeMediaPaginationOutput extends PaginationOutput(AnimeMedia) { }
