
import { ClassType, Field, InputType, ObjectType, registerEnumType } from "type-graphql";
import { Prop, modelOptions, types } from "@typegoose/typegoose";
import { MediaLink, MediaSearchLogic } from "../../utils/_media.types";
import { DataVirtual } from "../../utils";
import { FilterQuery } from "mongoose";
import { Base } from "../../utils/_media.base";


export enum CompanyLabel {
    STUDIO = "Studio",
    PRODUCER = "Producteur"
}

registerEnumType(CompanyLabel, {
    name: "CompanyLabel",
    description: "Company label"
})

@ObjectType()
export class Company extends Base('Company') {

    @Field(t => CompanyLabel)
    @Prop({ enum: CompanyLabel })
    label!: CompanyLabel

    @Field()
    @Prop()
    name!: string

    @Field(t => [MediaLink])
    @Prop({ type: [MediaLink] })
    links?: MediaLink[]

    @Field()
    @Prop()
    createdDate?: Date
}

@ObjectType()
@modelOptions({ schemaOptions: { _id: false, toJSON: { virtuals: true } } })
export class CompanyRelation extends DataVirtual(Company) {
    @Field()
    @Prop({ required: true })
    id!: string;
}

@InputType()
export class CompanySearchQuery {
    @Field({ nullable: true })
    name?: string;

    @Field(_ => CompanyLabel, { nullable: true })
    label?: CompanyLabel;

    static queryParse(this: types.QueryHelperThis<ClassType<Company>, CompanyCustomQuery>, props: CompanySearchQuery, logic: MediaSearchLogic) {
        let query: FilterQuery<Company>[] = [];

        if (props.name)
            query.push({ "data.name": { "$regex": props.name, "$options": "i" } })

        if (props.label)
            query.push({ "data.label": props.label })

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

    static genProjection(props: CompanySearchQuery) {
        let projections: { [key: string]: any } = {};

        return projections;
    }
}

export interface CompanyCustomQuery {
    queryParse: types.AsQueryMethod<typeof CompanySearchQuery.queryParse>;
}