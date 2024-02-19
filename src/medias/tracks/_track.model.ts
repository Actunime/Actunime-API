import { getModelForClass } from "@typegoose/typegoose";
import { ObjectType } from "type-graphql";
import { Track, TrackCustomQuery, TrackSearchQuery } from "./_track.type";
import { PaginationOutput } from "../../utils";
import { Media } from "../../utils/_media.base";

@ObjectType()
export class TrackPaginationOutput extends PaginationOutput<Track>(Track) { }

@ObjectType()
export class TrackMedia extends Media<Track>(Track, TrackSearchQuery.queryParse) { }

export const TrackModel = getModelForClass<typeof TrackMedia, TrackCustomQuery>(TrackMedia, { schemaOptions: { toJSON: { virtuals: true } } });

@ObjectType()
export class TrackMediaPaginationOutput extends PaginationOutput(TrackMedia) { }
