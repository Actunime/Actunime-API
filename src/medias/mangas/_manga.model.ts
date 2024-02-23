import { getModelForClass } from "@typegoose/typegoose";
import { ObjectType } from "type-graphql";
import { Manga, MangaCustomQuery, MangaSearchQuery } from "./_manga.type";
import { PaginationMedia } from "../../utils";
import { Media } from "../../utils/_media.base";
@ObjectType()
export class MangaPaginationMedia extends PaginationMedia<Manga>(Manga) { }

@ObjectType()
export class MangaMedia extends Media<Manga>(Manga, MangaSearchQuery.queryParse) { }

export const MangaModel = getModelForClass<typeof MangaMedia, MangaCustomQuery>(MangaMedia, { schemaOptions: { toJSON: { virtuals: true } } });
@ObjectType()
export class MangaMediaPagination extends PaginationMedia(MangaMedia) { }
