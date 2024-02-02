import { Pre, QueryMethod, modelOptions, getModelForClass } from "@typegoose/typegoose";
import { ObjectType } from "type-graphql";
import { genMediaFromUpdate } from "../../utils/_genMediaFromUpdate";
import { Anime, AnimeSearchQuery, CustomQuery } from "./_anime.type";
import { MediaFormatOutput, MediaFormat } from "../../utils/_media.format";
import { PaginationOutput } from "../../utils";

@ObjectType()
export class AnimeMediaOutput extends MediaFormatOutput<Anime>(Anime) { }

@ObjectType()
export class AnimeMediaPaginationOutput extends PaginationOutput<AnimeMediaOutput>(AnimeMediaOutput) { }

@ObjectType()
export class AnimePaginationOutput extends PaginationOutput<Anime>(Anime) { }

@Pre<AnimeMedia>('save', function (next) {
    this.data = genMediaFromUpdate<Anime>(this.updates.filter(u => u.visible));
    next()
})
@QueryMethod(AnimeSearchQuery.genQuery)
@ObjectType({ description: "Format Anime dans la base de données" })
@modelOptions({ options: { customName: "Anime" }, schemaOptions: { toJSON: { virtuals: true } } })
export class AnimeMedia extends MediaFormat<Anime>(Anime) { }

export const AnimeModel = getModelForClass<typeof AnimeMedia, CustomQuery>(AnimeMedia, { schemaOptions: { toJSON: { virtuals: true } } });
