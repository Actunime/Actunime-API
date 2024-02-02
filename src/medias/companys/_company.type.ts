
import { Field, InputType, ObjectType, registerEnumType } from "type-graphql";
import { Prop, Pre, modelOptions, getModelForClass, Ref } from "@typegoose/typegoose";
import { genMediaFromUpdate } from "../../utils/_genMediaFromUpdate";
import { MediaFormatOutput, MediaFormat } from "../../utils/_media.format";
// import { PaginationOutput } from "../../utils/_media.pagination";
import { MediaRequestFormat } from "../../utils/_media.request";
import { MediaLink } from "../../utils/_media.types";
import { MediaUpdateFormat } from "../../utils/_media.update";
import { DataVirtual } from "../../utils";


export enum CompanyLabel {
    STUDIO = "Studio",
    PRODUCER = "Producteur"
}

registerEnumType(CompanyLabel, {
    name: "CompanyLabel",
    description: "Company label"
})

@ObjectType()
export class Company {

    @Field()
    @Prop()
    id?: string;

    @Field()
    @Prop()
    pubId?: string;

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

    constructor(props: Company) {
        Object.assign(this, props);
    }
}

@ObjectType()
@modelOptions({ schemaOptions: { _id: false, toJSON: { virtuals: true } } })
export class CompanyRelation extends DataVirtual(Company) {
    @Field()
    @Prop({ required: true })
    pubId!: string;
}