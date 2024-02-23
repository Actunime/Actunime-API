

import { ClassType, Field, InputType, ObjectType, registerEnumType } from "type-graphql";
import { Prop, ModelOptions, types, ReturnModelType } from "@typegoose/typegoose";
import { MediaPersonOrCharacterName, MediaPersonGender, MediaSearchLogic } from "../../utils/_media.types";
import { PersonRelation } from "../persons/_person.model";
import { FilterQuery } from "mongoose";
import { fieldsProjection } from "graphql-fields-list";
import { IMedia } from "../../utils/_media.base";

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

    @Field(type => MediaPersonOrCharacterName, { nullable: true })
    @Prop(({ type: MediaPersonOrCharacterName }))
    name!: MediaPersonOrCharacterName

    @Field({ nullable: true })
    @Prop()
    age?: number;

    @Field({ nullable: true })
    @Prop()
    birthDate?: string;

    @Field(type => MediaPersonGender, { nullable: true })
    @Prop({ enum: MediaPersonGender })
    gender?: MediaPersonGender;

    @Field(type => CharacterSpecies, { nullable: true })
    @Prop({ enum: CharacterSpecies })
    species?: CharacterSpecies;

    @Field({ nullable: true })
    @Prop()
    bio?: string;

    @Field({ nullable: true })
    @Prop()
    image?: string;

    @Field(type => [PersonRelation], { nullable: true })
    @Prop({ type: [PersonRelation] })
    actors?: PersonRelation[];
}

export enum CharacterRelationLabel {
    Principal = 'PRINCIPAL',
    Secondaire = "SECONDAIRE",
    Figurant = "FIGURANT",
    Antagoniste = "ANTAGONISTE",
    Soutien = "SOUTIEN"
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


@InputType()
export class CharacterSearchQuery {
    @Field({ nullable: true })
    name?: string;

    static async dynamicPopulate(this: types.QueryHelperThis<ClassType<IMedia<Character>>, CharacterCustomQuery>, info: any) {
        if (!info) return this;
        const projection = Object.fromEntries(Object.keys(fieldsProjection(info)).map(key => [key, 1]));

        const staffsRelations = Object.keys(projection).filter(key => key.includes('.actors.'))
        if (staffsRelations.length) {
            this?.populate({
                path: 'data.actors.person',
            })
        }

        return this;
    }

    static parse<TModel extends new (...args: any) => any>(props: CharacterSearchQuery | null, logic?: MediaSearchLogic, model?: TModel) {
        let query: FilterQuery<ReturnModelType<TModel, CharacterCustomQuery>>[] = [];
       
        if (!props) return {};

        if (props.name)
            query = query.concat([
                { "data.name.first": { "$regex": props.name, "$options": "i" } },
                { "data.name.end": { "$regex": props.name, "$options": "i" } },
                { "data.name.alias": { "$regex": props.name, "$options": "i" } },
            ])

        switch (logic) {
            case MediaSearchLogic.OR:
                query = [{ $or: query }]
                return query[0];

            case MediaSearchLogic.AND:
                query = [{ $and: query }]
                return query[0]

            default:
                query = [{ $or: query }]
                return query[0];
        }
    }

    static queryParse(this: types.QueryHelperThis<ClassType<Character>, CharacterCustomQuery>, props: CharacterSearchQuery, logic: MediaSearchLogic) {
       
        const query = CharacterSearchQuery.parse(props, logic);

        this.setQuery(query as any);

        return this;
    }

    static genProjection(props: CharacterSearchQuery) {
        let projections: { [key: string]: any } = {};

        return projections;
    }
}

export interface CharacterCustomQuery {
    queryParse: types.AsQueryMethod<typeof CharacterSearchQuery.queryParse>;
    dynamicPopulate: types.AsQueryMethod<typeof CharacterSearchQuery.dynamicPopulate>;
}
