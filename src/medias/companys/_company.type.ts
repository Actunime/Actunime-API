
import { ClassType, Field, InputType, ObjectType, registerEnumType } from "type-graphql";
import { Prop, ReturnModelType, types } from "@typegoose/typegoose";
import { MediaLink, MediaSearchLogic } from "../../utils/_media.types";
import { FilterQuery } from "mongoose";
import { IMedia } from "../../utils/_media.base";


export enum CompanyType {
    STUDIO = "STUDIO",
    PRODUCER = "PRODUCER"
}

registerEnumType(CompanyType, {
    name: "CompanyType",
    description: "Company label"
})

@ObjectType()
export class Company {

    @Field(t => CompanyType)
    @Prop({ enum: CompanyType })
    type!: CompanyType

    @Field()
    @Prop()
    name!: string

    @Field(t => [MediaLink], { nullable: true })
    @Prop({ type: [MediaLink] })
    links?: MediaLink[]

    @Field({ nullable: true })
    @Prop()
    createdDate?: Date
}

@InputType()
export class CompanySearchQuery {
    @Field({ nullable: true })
    name?: string;

    @Field(_ => CompanyType, { nullable: true })
    type?: CompanyType;

    static async dynamicPopulate(this: types.QueryHelperThis<ClassType<IMedia<Company>>, CompanyCustomQuery>, info: any) {
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


    static parse<TModel extends new (...args: any) => any>(props: CompanySearchQuery | null, logic?: MediaSearchLogic, model?: TModel) {
        let query: FilterQuery<ReturnModelType<TModel, CompanyCustomQuery>>[] = [];

        if (!props) return {};

        if (props.name)
            query.push({ "data.name": { "$regex": props.name, "$options": "i" } })

        if (props.type)
            query.push({ "data.type": props.type })

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

    static queryParse(this: types.QueryHelperThis<ClassType<Company>, CompanyCustomQuery>, props: CompanySearchQuery, logic: MediaSearchLogic) {

        const query = CompanySearchQuery.parse(props, logic);

        this.setQuery(query as any);

        return this;
    }

    static genProjection(props: CompanySearchQuery) {
        let projections: { [key: string]: any } = {};

        return projections;
    }
}

export interface CompanyCustomQuery {
    queryParse: types.AsQueryMethod<typeof CompanySearchQuery.queryParse>;
    dynamicPopulate: types.AsQueryMethod<typeof CompanySearchQuery.dynamicPopulate>;
}