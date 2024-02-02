import { modelOptions, Pre, getModelForClass } from "@typegoose/typegoose";
import { ObjectType } from "type-graphql";
import { Character } from "./_character.type";
import { MediaFormatOutput, PaginationOutput, genMediaFromUpdate, MediaFormat } from "../../utils";

@ObjectType()
export class CharacterMediaOutput extends MediaFormatOutput<Character>(Character) { }

@ObjectType()
export class CharacterMediaPaginationOutput extends PaginationOutput<CharacterMediaOutput>(CharacterMediaOutput) { }

@Pre<CharacterMedia>('save', function (next) {
    this.data = genMediaFromUpdate<Character>(this.updates.filter(u => u.visible));
    next()
})

@ObjectType({ description: "Format Media dans la base de données" })
@modelOptions({ options: { customName: "Character" } })
export class CharacterMedia extends MediaFormat<Character>(Character) { }

const CharacterModel = getModelForClass<typeof CharacterMedia>(CharacterMedia, { schemaOptions: { toJSON: { virtuals: true } } });

export { CharacterModel }