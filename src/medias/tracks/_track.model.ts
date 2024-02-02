import { Pre, modelOptions, getModelForClass } from "@typegoose/typegoose";
import { ObjectType, InputType, Field } from "type-graphql";
import { genMediaFromUpdate } from "../../utils/_genMediaFromUpdate";
import { MediaFormatOutput, MediaFormat } from "../../utils/_media.format";
// import { PaginationOutput } from "../../utils/_media.pagination";
import { MediaRequestFormat } from "../../utils/_media.request";
import { MediaUpdateFormat } from "../../utils/_media.update";
import { Track } from "./_track.type";

@ObjectType()
export class TrackMediaOutput extends MediaFormatOutput<Track>(Track) { }

// @ObjectType()
// export class TrackMediaPaginationOutput extends PaginationOutput<TrackMediaOutput>(TrackMediaOutput) { }

// @ObjectType()
// export class TrackPaginationOutput extends PaginationOutput<Track>(Track) { }

@InputType()
export class TrackSearchQuery {
    @Field()
    title!: string;
}

@Pre<TrackMedia>('save', function (next) {
    this.data = genMediaFromUpdate<Track>(this.updates.filter(u => u.visible));
    next()
})

@ObjectType({ description: "Format Media dans la base de données" })
@modelOptions({ options: { customName: "Track" } })
export class TrackMedia extends MediaFormat<Track>(Track) { }

export const TrackModel = getModelForClass<typeof TrackMedia>(TrackMedia, { schemaOptions: { toJSON: { virtuals: true } } });