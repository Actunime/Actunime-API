import { Company, CompanyModel } from "./";
import { Field, InputType } from "type-graphql";
import { Prop } from "@typegoose/typegoose";

@InputType()
export class CompanyInput implements Partial<Company> {
    @Field()
    @Prop()
    label!: 'studio' | 'producer'

    @Field()
    @Prop()
    name!: string

    @Field()
    @Prop()
    siteUrl!: string

    @Field()
    @Prop()
    createdDate!: Date


    public async init(props: CompanyInput) {
        this.label = props.label;
        this.name = props.name;
        this.siteUrl = props.siteUrl;
        this.createdDate = props.createdDate;

        return {
            ...this,
            doc: new CompanyModel(this)
        }
    }
}