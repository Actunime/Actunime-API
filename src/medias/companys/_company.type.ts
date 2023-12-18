import * as GraphqlType from "type-graphql";
import * as MongooseType from "@typegoose/typegoose";
import { CompanyInput } from "./";
import * as UtilType from "../util.type";

@GraphqlType.ObjectType()
export class Company {
    // _id?: string

    @GraphqlType.Field()
    @MongooseType.prop()
    pubId?: string;

    @GraphqlType.Field()
    @MongooseType.prop()
    label!: 'studio' | 'producer'

    @GraphqlType.Field()
    @MongooseType.prop()
    name!: string

    @GraphqlType.Field()
    @MongooseType.prop()
    siteUrl!: string

    @GraphqlType.Field()
    @MongooseType.prop()
    createdDate!: Date
}

@GraphqlType.ObjectType({ description: "Format AnimeUpdate dans la base de données" })
export class CompanyUpdate extends UtilType.MediaUpdateFormat<Company> {
    @MongooseType.prop({ type: () => Company })
    @GraphqlType.Field(_ => Company)
    declare data: Company;
}

@GraphqlType.ObjectType({ description: "Format AnimeRequest dans la base de données" })
export class CompanyRequest extends UtilType.MediaUpdateRequestFormat<Company> {
    @MongooseType.prop({ type: () => Company })
    @GraphqlType.Field(_ => Company)
    declare data: Company;
}

@GraphqlType.ObjectType({ description: "Format Media dans la base de données" })
export class CompanyMedia extends UtilType.MediaFormat<Company, CompanyUpdate, CompanyRequest>{
    @MongooseType.prop({ default: [] })
    @GraphqlType.Field(_ => [CompanyUpdate])
    declare updates: CompanyUpdate[];
    @MongooseType.prop({ default: [] })
    @GraphqlType.Field(_ => [CompanyRequest])
    declare updatesRequests: CompanyRequest[];
}

@GraphqlType.ObjectType()
export class CompanyRelation {
    @GraphqlType.Field(_ => Company)
    @MongooseType.prop({ type: () => Company })
    data?: UtilType.ObjectId | Company;
}

@GraphqlType.InputType({ description: "Relation Company, ajouter une nouvelle société en même temps qu'un nouveau media." })
class CompanyRelationAddInput {
    @GraphqlType.Field(_ => CompanyInput)
    data!: CompanyInput;
}

@GraphqlType.InputType({ description: "Relation Company, ajouter une société a un nouveau media." })
class CompanyRelationExistInput {
    @GraphqlType.Field(_ => String)
    pubId!: string;
}

@GraphqlType.InputType()
export class CompanyRelationFields {
    @GraphqlType.Field(_ => [CompanyRelationAddInput])
    news!: CompanyRelationAddInput[]
    @GraphqlType.Field(_ => [CompanyRelationExistInput])
    exists!: CompanyRelationExistInput[]
}

export const CompanyModel = MongooseType.getModelForClass<typeof CompanyMedia>(CompanyMedia, { schemaOptions: { toJSON: { virtuals: true } } });