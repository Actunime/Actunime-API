import { Prop, Ref, getModelForClass, modelOptions } from "@typegoose/typegoose";
import { Field, ObjectType } from "type-graphql";
import { Company, CompanyCustomQuery, CompanySearchQuery } from "./_company.type";
import { PaginationMedia } from "../../utils";
import { Media } from "../../utils/_media.base";
@ObjectType()
export class CompanyPaginationMedia extends PaginationMedia<Company>(Company) { }

@ObjectType()
export class CompanyMedia extends Media<Company>(Company, CompanySearchQuery.queryParse, CompanySearchQuery.dynamicPopulate) { }

@ObjectType()
@modelOptions({ schemaOptions: { _id: false, toJSON: { virtuals: true } } })
export class CompanyRelation {
    @Field()
    @Prop({ required: true })
    id!: string;

    @Field(_ => CompanyMedia, { nullable: true })
    @Prop({
        required: true,
        ref: () => CompanyMedia,
        type: () => String,
        foreignField: 'id',
        localField: 'id',
        justOne: true,
        default: undefined
    })
    company!: Ref<CompanyMedia, string>;
}

export const CompanyModel = getModelForClass<typeof CompanyMedia, CompanyCustomQuery>(CompanyMedia, { schemaOptions: { toJSON: { virtuals: true } } });
@ObjectType()
export class CompanyMediaPagination extends PaginationMedia(CompanyMedia) { }
