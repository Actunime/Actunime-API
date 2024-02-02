

import { Field, InputType, ObjectType } from "type-graphql";
import { Prop, Pre, modelOptions, getModelForClass } from "@typegoose/typegoose";
import { genMediaFromUpdate } from "../../utils/_genMediaFromUpdate";
import { MediaFormatOutput, MediaFormat } from "../../utils/_media.format";
// import { PaginationOutput } from "../../utils/_media.pagination";
import { MediaRequestFormat } from "../../utils/_media.request";
import { MediaLink } from "../../utils/_media.types";
import { MediaUpdateFormat } from "../../utils/_media.update";
import { PersonRelation } from "../persons/_person.type";
import { DataVirtual } from "../../utils";

@ObjectType()
export class Track {

    @Field()
    @Prop()
    id?: string;

    @Field()
    @Prop()
    pubId?: string;

    @Field()
    @Prop()
    name!: string

    @Field(type => [MediaLink])
    @Prop({ type: MediaLink })
    links?: MediaLink[]

    @Field()
    @Prop()
    outDate?: Date;

    @Field()
    @Prop()
    image?: string;

    @Field(type => [PersonRelation])
    @Prop({ type: [PersonRelation] })
    artists?: PersonRelation[];

    constructor(props: Track) {
        Object.assign(this, props);
    }
}
@ObjectType()
@modelOptions({ schemaOptions: { _id: false, toJSON: { virtuals: true } } })
export class TrackRelation extends DataVirtual(Track) {

    @Field({ nullable: true })
    @Prop({ required: true })
    pubId?: string;

    @Field({ nullable: true })
    @Prop()
    label?: string;

    @Field(type => [Number], { nullable: true })
    @Prop({ type: [Number] })
    episodes?: number[];
}