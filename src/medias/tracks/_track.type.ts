

import { ClassType, Field, InputType, ObjectType, registerEnumType } from "type-graphql";
import { Prop, modelOptions, types } from "@typegoose/typegoose";
import { Base } from "../../utils/_media.base";
import { MediaLink, MediaSearchLogic } from "../../utils/_media.types";
import { PersonRelation } from "../persons/_person.type";
import { DataVirtual } from "../../utils";
import { FilterQuery } from "mongoose";

@ObjectType()
export class Track extends Base('Track') {

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

}
@ObjectType()
@modelOptions({ schemaOptions: { _id: false, toJSON: { virtuals: true } } })
export class TrackRelation extends DataVirtual(Track) {

    @Field({ nullable: true })
    @Prop({ required: true })
    id?: string;

    @Field({ nullable: true })
    @Prop()
    label?: TrackLabelRelation;

    @Field(type => [Number], { nullable: true })
    @Prop({ type: [Number] })
    episodes?: number[];
}

@InputType()
export class TrackSearchQuery {
    @Field({ nullable: true })
    name?: string;

    static queryParse(this: types.QueryHelperThis<ClassType<Track>, TrackCustomQuery>, props: TrackSearchQuery, logic: MediaSearchLogic) {
        let query: FilterQuery<Track>[] = [];

        if (props.name)
            query.push({ "data.name": { "$regex": props.name, "$options": "i" } })

        switch (logic) {
            case MediaSearchLogic.OR:
                if (query.length) this.or(query)
                break;

            case MediaSearchLogic.AND:
                if (query.length) this.and(query)
                break;

            default:
                if (query.length) this.or(query)
                break;
        }

        console.log('query', this.getQuery())

        return this;
    }

    static genProjection(props: TrackSearchQuery) {
        let projections: { [key: string]: any } = {};

        return projections;
    }
}

export interface TrackCustomQuery {
    queryParse: types.AsQueryMethod<typeof TrackSearchQuery.queryParse>;
}

export enum TrackLabelRelation {
    'OPENING' = 'OPENING',
    'ENDING' = 'ENDING',
    'OST' = 'OST',
    'INSERT' = "INSERT"
}

registerEnumType(TrackLabelRelation, {
    name: 'TrackLabelRelation'
})
