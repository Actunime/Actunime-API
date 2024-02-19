import { getModelForClass } from "@typegoose/typegoose";
import { ObjectType } from "type-graphql";
import { Company, CompanyCustomQuery, CompanySearchQuery } from "./_company.type";
import { PaginationOutput } from "../../utils";
import { Media } from "../../utils/_media.base";
@ObjectType()
export class CompanyPaginationOutput extends PaginationOutput<Company>(Company) { }

@ObjectType()
export class CompanyMedia extends Media<Company>(Company, CompanySearchQuery.queryParse) { }

export const CompanyModel = getModelForClass<typeof CompanyMedia, CompanyCustomQuery>(CompanyMedia, { schemaOptions: { toJSON: { virtuals: true } } });
@ObjectType()
export class CompanyMediaPaginationOutput extends PaginationOutput(CompanyMedia) { }
