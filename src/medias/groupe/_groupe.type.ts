import { Index, Prop, modelOptions, types } from "@typegoose/typegoose";
import { ClassType, Field, InputType, ObjectType } from "type-graphql";
import { DataVirtual, MediaSearchLogic } from "../../utils";
import { FilterQuery } from "mongoose";
import { Base } from "../../utils/_media.base";


@ObjectType()
export class Groupe extends Base('Groupe') {
    @Prop({ required: true, unique: true })
    @Field()
    name?: string;
}

@ObjectType()
export class GroupeUpdateOutput {
    @Field(type => String, { nullable: true })
    message?: string | null;
    @Field(type => String, { nullable: true })
    id?: string | null;
    @Field(type => String, { nullable: true })
    name?: string | null;
    @Field(type => String, { nullable: true })
    error?: string | null;
}

@ObjectType()
@modelOptions({ schemaOptions: { _id: false, toJSON: { virtuals: true } } })
export class GroupeRelation extends DataVirtual(Groupe) {
    @Field()
    @Prop({ required: true })
    id!: string;
}


@InputType()
export class GroupeSearchQuery {
    @Field({ nullable: true })
    name?: string;
    //? ajouter un champ pour la recherche avec plusieurs ids ?

    static queryParse(this: types.QueryHelperThis<ClassType<Groupe>, GroupeCustomQuery>, props: GroupeSearchQuery, logic: MediaSearchLogic) {
        let query: FilterQuery<Groupe>[] = [];

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

    static genProjection(props: GroupeSearchQuery) {
        let projections: { [key: string]: any } = {};

        return projections;
    }
}

export interface GroupeCustomQuery {
    queryParse: types.AsQueryMethod<typeof GroupeSearchQuery.queryParse>;
}