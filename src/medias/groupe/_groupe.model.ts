import { getModelForClass } from "@typegoose/typegoose";
import { ObjectType } from "type-graphql";
import { Groupe, GroupeCustomQuery, GroupeSearchQuery } from "./_groupe.type";
import { PaginationOutput } from "../../utils";
import { Media } from "../../utils/_media.base";

@ObjectType()
export class GroupePaginationOutput extends PaginationOutput<Groupe>(Groupe) { }

@ObjectType()
export class GroupeMedia extends Media<Groupe>(Groupe, GroupeSearchQuery.queryParse) { }

export const GroupeModel = getModelForClass<typeof GroupeMedia, GroupeCustomQuery>(GroupeMedia, { schemaOptions: { toJSON: { virtuals: true } } });

@ObjectType()
export class GroupeMediaPaginationOutput extends PaginationOutput(GroupeMedia) { }
