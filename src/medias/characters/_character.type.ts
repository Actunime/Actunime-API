

import { Field, InputType, ObjectType, registerEnumType } from "type-graphql";
import { Prop, ModelOptions, modelOptions, Ref } from "@typegoose/typegoose";
import { MediaPersonOrCharacterName, MediaPersonGender } from "../../utils/_media.types";
import { PersonRelation } from "../persons/_person.type";
import { DataVirtual } from "../../utils/_media.virtual";
import { MediaFormatOutput } from "../../utils/_media.format";
// import { PaginationOutput } from "../../utils/_media.pagination";


export enum CharacterSpecies {
    ELFE = "ELFE",
    NAIN = "NAIN",
    HUMAIN = "HUMAIN",
    MONSTRE = "MONSTRE"
}

registerEnumType(CharacterSpecies, {
    name: "CharacterSpecies",
    description: "Différent type de personnages"
})


@ObjectType()
@ModelOptions({ schemaOptions: { _id: false, toJSON: { virtuals: true } } })
export class Character {

    @Field()
    @Prop()
    id?: string;

    @Field()
    @Prop()
    pubId?: string;

    @Field(type => MediaPersonOrCharacterName)
    @Prop(({ type: MediaPersonOrCharacterName }))
    name!: MediaPersonOrCharacterName

    @Field()
    @Prop()
    age?: number;

    @Field()
    @Prop()
    birthDate?: string;

    @Field(type => MediaPersonGender)
    @Prop({ enum: MediaPersonGender })
    gender?: MediaPersonGender;

    @Field(type => CharacterSpecies)
    @Prop({ enum: CharacterSpecies })
    species?: CharacterSpecies;

    @Field()
    @Prop()
    bio?: string;

    @Field()
    @Prop()
    image?: string;

    @Field(type => [PersonRelation])
    @Prop({ type: [PersonRelation] })
    actors?: PersonRelation[];

    constructor(props: Character) {
        Object.assign(this, props);
    }
}

export enum CharacterRelationLabel {
    Principal,
    Secondaire,
    Figurant,
    Antagoniste,
    Soutien
}

registerEnumType(CharacterRelationLabel, {
    name: 'CharacterRelationLabel'
})

/**
 * 
 * Personnages principaux : Ce sont les personnages autour desquels l’histoire tourne principalement. Ils sont au cœur de l’intrigue et font avancer l’histoire.
 * 
 * Personnages secondaires : Ils jouent un rôle de soutien aux personnages principaux. Ils peuvent avoir leurs propres arcs narratifs, mais ils ne sont généralement pas aussi développés que ceux des personnages principaux.
 * 
 * Figurants : Ce sont des personnages qui n’ont pas d’influence sur le récit. Ils sont utilisés pour donner un sentiment de « vie » autour des personnages principaux et secondaires1.
 * 
 * Antagonistes : Ils sont en opposition avec les personnages principaux et créent des conflits dans l’histoire.
 * 
 * Personnages de soutien : Ils aident les personnages principaux et secondaires dans leur quête ou leur développement.
 * 
 */

@ObjectType()
@modelOptions({ schemaOptions: { _id: false, toJSON: { virtuals: true } } })
export class CharacterRelation extends DataVirtual(Character) {
    @Field(_ => String)
    @Prop({ type: () => String, required: true })
    pubId!: string;

    @Field(_ => CharacterRelationLabel, { nullable: true })
    @Prop({ enum: CharacterRelationLabel, default: undefined })
    label?: CharacterRelationLabel;
}

// @ObjectType()
// export class CharacterPaginationOutput extends PaginationOutput<Character>(Character) { }

@InputType()
export class CharacterSearchQuery {
    @Field()
    title!: string;
}