

import { ClassType, Field, InputType, ObjectType, registerEnumType } from "type-graphql";
import { Prop, ReturnModelType, types } from "@typegoose/typegoose";
import { MediaLink, MediaSearchLogic } from "../../utils/_media.types";
import { PersonRelation } from "../persons/_person.model";
import { FilterQuery } from "mongoose";
import { fieldsProjection } from "graphql-fields-list";
import { IMedia } from "../../utils/_media.base";

@ObjectType()
export class Track {

    @Field()
    @Prop()
    name!: string

    @Field(type => [MediaLink], { nullable: true })
    @Prop({ type: MediaLink })
    links?: MediaLink[]

    @Field({ nullable: true })
    @Prop()
    outDate?: Date;

    @Field({ nullable: true })
    @Prop()
    image?: string;

    @Field(type => [PersonRelation], { nullable: true })
    @Prop({ type: [PersonRelation] })
    artists?: PersonRelation[];

}
@InputType()
export class TrackSearchQuery {
    @Field({ nullable: true })
    name?: string;

    static async dynamicPopulate(this: types.QueryHelperThis<ClassType<IMedia<Track>>, TrackCustomQuery>, info: any) {
        if (!info) return this;
        const projection = Object.fromEntries(Object.keys(fieldsProjection(info)).map(key => [key, 1]));

        const artistsRelations = Object.keys(projection).filter(key => key.includes('.artists.'))
        if (artistsRelations.length) {
            this?.populate({
                path: 'data.artists.person',
            })
        }

        return this;
    }

    static parse<TModel extends new (...args: any) => any>(props: TrackSearchQuery | null, logic?: MediaSearchLogic, model?: TModel) {
        let query: FilterQuery<ReturnModelType<TModel, TrackCustomQuery>>[] = [];

        if (!props) return {};


        if (props.name)
            query.push({ "data.name": { "$regex": props.name, "$options": "i" } })

        switch (logic) {
            case MediaSearchLogic.OR:
                query = [{ $or: query }]
                return query[0];

            case MediaSearchLogic.AND:
                query = [{ $and: query }]
                return query[0]

            default:
                query = [{ $or: query }]
                return query[0];
        }
    }

    static queryParse(this: types.QueryHelperThis<ClassType<Track>, TrackCustomQuery>, props: TrackSearchQuery, logic: MediaSearchLogic) {

        const query = TrackSearchQuery.parse(props, logic);

        this.setQuery(query as any);

        return this;
    }

    static genProjection(props: TrackSearchQuery) {
        let projections: { [key: string]: any } = {};

        return projections;
    }
}

export interface TrackCustomQuery {
    queryParse: types.AsQueryMethod<typeof TrackSearchQuery.queryParse>;
    dynamicPopulate: types.AsQueryMethod<typeof TrackSearchQuery.dynamicPopulate>;
}

export enum TrackRelationLabel {
    'OPENING' = 'OPENING',
    'ENDING' = 'ENDING',
    'OST' = 'OST',
    'INSERT' = "INSERT"
}

registerEnumType(TrackRelationLabel, {
    name: 'TrackRelationLabel'
})
