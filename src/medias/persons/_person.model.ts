import { getModelForClass } from "@typegoose/typegoose";
import { ObjectType } from "type-graphql";
import { Person, PersonCustomQuery, PersonSearchQuery } from "./_person.type";
import { PaginationOutput } from "../../utils";
import { Media } from "../../utils/_media.base";

@ObjectType()
export class PersonPaginationOutput extends PaginationOutput<Person>(Person) { }

@ObjectType()
export class PersonMedia extends Media<Person>(Person, PersonSearchQuery.queryParse) { }

export const PersonModel = getModelForClass<typeof PersonMedia, PersonCustomQuery>(PersonMedia, { schemaOptions: { toJSON: { virtuals: true } } });

@ObjectType()
export class PersonMediaPaginationOutput extends PaginationOutput(PersonMedia) { }
