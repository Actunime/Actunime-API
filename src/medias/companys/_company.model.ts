import { Pre, modelOptions, getModelForClass } from "@typegoose/typegoose";
import { ObjectType, InputType, Field } from "type-graphql";
import { genMediaFromUpdate } from "../../utils/_genMediaFromUpdate";
import { MediaFormatOutput, MediaFormat } from "../../utils/_media.format";
// import { PaginationOutput } from "../../utils/_media.pagination";
import { Company } from "./_company.type";

// @ObjectType()
// class CompanyUpdates extends MediaUpdateFormat<Company>(Company) { };
// @ObjectType()
// class CompanyRequests extends MediaRequestFormat<Company>(Company) { };


@ObjectType()
export class CompanyMediaOutput extends MediaFormatOutput<Company>(Company) { }

// @ObjectType()
// export class CompanyMediaPaginationOutput extends PaginationOutput<CompanyMediaOutput>(CompanyMediaOutput) { }

// @ObjectType()
// export class CompanyPaginationOutput extends PaginationOutput<Company>(Company) { }

@InputType()
export class CompanySearchQuery {
    @Field()
    title!: string;
}



@Pre<CompanyMedia>('save', function (next) {
    this.data = genMediaFromUpdate<Company>(this.updates.filter(u => u.visible));
    next()
})

@ObjectType({ description: "Format Media dans la base de données" })
@modelOptions({ options: { customName: "Company" } })
export class CompanyMedia extends MediaFormat<Company>(Company) { }

export const CompanyModel = getModelForClass<typeof CompanyMedia>(CompanyMedia, { schemaOptions: { toJSON: { virtuals: true } } });