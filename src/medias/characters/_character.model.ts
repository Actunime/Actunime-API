import { Prop, Ref, getModelForClass, modelOptions } from "@typegoose/typegoose";
import { Field, ObjectType } from "type-graphql";
import { Character, CharacterCustomQuery, CharacterRelationLabel, CharacterSearchQuery } from "./_character.type";
import { PaginationMedia } from "../../utils";
import { Media } from "../../utils/_media.base";
@ObjectType()
export class CharacterPaginationMedia extends PaginationMedia<Character>(Character) { }

@ObjectType()
export class CharacterMedia extends Media<Character>(Character, CharacterSearchQuery.queryParse, CharacterSearchQuery.dynamicPopulate) { }

@ObjectType()
@modelOptions({ schemaOptions: { _id: false, toJSON: { virtuals: true }, toObject: { virtuals: true } } })
export class CharacterRelation {
    @Field(_ => String)
    @Prop({ required: true })
    id!: string;

    @Field(_ => CharacterRelationLabel, { nullable: true })
    @Prop({ enum: CharacterRelationLabel, default: undefined })
    label?: CharacterRelationLabel;

    @Field(_ => CharacterMedia, { nullable: true })
    @Prop({
        required: true,
        ref: () => CharacterMedia,
        type: () => String,
        foreignField: 'id',
        localField: 'id',
        justOne: true,
        default: undefined
    })
    character!: Ref<CharacterMedia, string>;
}

export const CharacterModel = getModelForClass<typeof CharacterMedia, CharacterCustomQuery>(CharacterMedia, { schemaOptions: { toJSON: { virtuals: true } } });
@ObjectType()
export class CharacterMediaPagination extends PaginationMedia(CharacterMedia) { }

