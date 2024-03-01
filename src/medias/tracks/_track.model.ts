import { Prop, Ref, getModelForClass, modelOptions } from "@typegoose/typegoose";
import { Field, ObjectType } from "type-graphql";
import { Track, TrackCustomQuery, TrackRelationLabel, TrackSearchQuery } from "./_track.type";
import { PaginationMedia } from "../../utils";
import { Media } from "../../utils/_media.base";

@ObjectType()
export class TrackPaginationMedia extends PaginationMedia<Track>(Track) { }

@ObjectType()
export class TrackMedia extends Media<Track>(Track, TrackSearchQuery.queryParse, TrackSearchQuery.dynamicPopulate) { }

@ObjectType()
@modelOptions({ schemaOptions: { _id: false, toJSON: { virtuals: true } } })
export class TrackRelation {

    @Field({ nullable: true })
    @Prop({ required: true })
    id!: string;

    @Field(_ => TrackRelationLabel, { nullable: true })
    @Prop()
    label?: TrackRelationLabel;

    @Field(type => [Number], { nullable: true })
    @Prop({ type: [Number] })
    episodes?: number[];

    @Field(_ => TrackMedia, { nullable: true })
    @Prop({
        required: true,
        ref: () => TrackMedia,
        type: () => String,
        foreignField: 'id',
        localField: 'id',
        justOne: true,
        default: undefined
    })
    track!: Ref<TrackMedia, string>;
}


export const TrackModel = getModelForClass<typeof TrackMedia, TrackCustomQuery>(TrackMedia, { schemaOptions: { toJSON: { virtuals: true } } });

@ObjectType()
export class TrackMediaPagination extends PaginationMedia(TrackMedia) { }
