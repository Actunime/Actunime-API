import { Prop, ReturnModelType, modelOptions, types } from "@typegoose/typegoose";
import { ClassType, Field, InputType, ObjectType } from "type-graphql";
import { DataVirtual, MediaSearchLogic } from "../../utils";
import { FilterQuery } from "mongoose";
import { IMedia } from "../../utils/_media.base";


@ObjectType()
export class Groupe {

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
    @Prop()
    id!: string;
}

@InputType()
export class GroupeSearchQuery {
    @Field({ nullable: true })
    name?: string;
    //? ajouter un champ pour la recherche avec plusieurs ids ?

    static async dynamicPopulate(this: types.QueryHelperThis<ClassType<IMedia<Groupe>>, GroupeCustomQuery>, info: any) {
        if (!info) return this;
        // const projection = Object.fromEntries(Object.keys(fieldsProjection(info)).map(key => [key, 1]));

        // const staffsRelations = Object.keys(projection).filter(key => key.includes('.actors.'))
        // if (staffsRelations.length) {
        //     this?.populate({
        //         path: 'data.actors.person',
        //     })
        // }

        return this;
    }

    static parse<TModel extends new (...args: any) => any>(props: GroupeSearchQuery | null, logic?: MediaSearchLogic, model?: TModel) {
        let query: FilterQuery<ReturnModelType<TModel, GroupeCustomQuery>>[] = [];
       
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

    static queryParse(this: types.QueryHelperThis<ClassType<Groupe>, GroupeCustomQuery>, props: GroupeSearchQuery, logic: MediaSearchLogic) {
       
        const query = GroupeSearchQuery.parse(props, logic);

        this.setQuery(query as any);

        return this;
    }


    static genProjection(props: GroupeSearchQuery) {
        let projections: { [key: string]: any } = {};

        return projections;
    }
}

export interface GroupeCustomQuery {
    queryParse: types.AsQueryMethod<typeof GroupeSearchQuery.queryParse>;
    dynamicPopulate: types.AsQueryMethod<typeof GroupeSearchQuery.dynamicPopulate>;
}