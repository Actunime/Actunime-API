import { getModelForClass } from "@typegoose/typegoose";
import { ObjectType } from "type-graphql";
import { Character, CharacterCustomQuery, CharacterSearchQuery } from "./_character.type";
import { PaginationOutput } from "../../utils";
import { Media } from "../../utils/_media.base";
@ObjectType()
export class CharacterPaginationOutput extends PaginationOutput<Character>(Character) { }

@ObjectType()
export class CharacterMedia extends Media<Character>(Character, CharacterSearchQuery.queryParse) { }

export const CharacterModel = getModelForClass<typeof CharacterMedia, CharacterCustomQuery>(CharacterMedia, { schemaOptions: { toJSON: { virtuals: true } } });
@ObjectType()
export class CharacterMediaPaginationOutput extends PaginationOutput(CharacterMedia) { }
