import { Prop, Ref, getModelForClass, modelOptions } from "@typegoose/typegoose";
import { Field, ObjectType } from "type-graphql";
import { Person, PersonCustomQuery, PersonSearchQuery, PersonrRoleRelationLabel } from "./_person.type";
import { PaginationMedia } from "../../utils";
import { Media } from "../../utils/_media.base";

@ObjectType()
export class PersonPaginationMedia extends PaginationMedia<Person>(Person) { }

@ObjectType()
export class PersonMedia extends Media<Person>(Person, PersonSearchQuery.queryParse) { }


@ObjectType()
@modelOptions({ schemaOptions: { _id: false, toJSON: { virtuals: true }, toObject: { virtuals: true } } })
export class PersonRelation {
    @Field()
    @Prop({ required: true })
    id!: string;
    @Field()
    @Prop()
    label?: PersonrRoleRelationLabel;;

    @Field(_ => PersonMedia, { nullable: true })
    @Prop({
        required: true,
        ref: () => PersonMedia,
        type: () => String,
        foreignField: 'id',
        localField: 'id',
        justOne: true,
        default: undefined
    })
    person!: Ref<PersonMedia, string>;
}


export const PersonModel = getModelForClass<typeof PersonMedia, PersonCustomQuery>(PersonMedia, { schemaOptions: { toJSON: { virtuals: true } } });

@ObjectType()
export class PersonMediaPagination extends PaginationMedia(PersonMedia) { }
