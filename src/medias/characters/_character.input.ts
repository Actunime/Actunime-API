
import { Field, InputType } from "type-graphql";
import { CharacterSpecies, Character, CharacterRelationLabel } from './_character.type';
import { MediaPersonOrCharacterNameInput, MediaPersonGender } from "../../utils/_media.types";
import { PersonInput, PersonRelationFields } from "../persons/_person.input";
import { MediaDoc, UpdateParams, createUpdate } from "../../utils/_createUpdate";
import { CharacterModel, CharacterRelation } from "./_character.model";
import { MediaRequiredFields } from "../../utils/_media.base";


@InputType()
export class CharacterInput {

    @Field(type => MediaPersonOrCharacterNameInput)
    name!: MediaPersonOrCharacterNameInput

    @Field()
    age?: number;

    @Field()
    birthDate?: string;

    @Field(type => MediaPersonGender)
    gender?: MediaPersonGender;

    @Field(type => CharacterSpecies)
    species?: CharacterSpecies;

    @Field()
    bio?: string;

    @Field()
    image?: string;

    @Field(type => PersonRelationFields)
    actors?: PersonRelationFields;

    static createUpdate(props: CharacterInput, action: "request" | "direct_update", params: Omit<UpdateParams<Character>, 'db' | 'changes'>) {

        const db = CharacterModel;
        let docToSaveWith: MediaDoc<any>[] = [];

        let changes: Omit<Character, MediaRequiredFields> = {
            ...props,
            actors: props.actors ? PersonInput.InitFromRelation(props.actors, action, (m) => docToSaveWith = docToSaveWith.concat(m), params) : undefined
        };

        if (action === 'direct_update') {
            return createUpdate<Omit<Character, MediaRequiredFields>>({ changes, db, docToSaveWith, ...params })
        } else {
            return createUpdate<Omit<Character, MediaRequiredFields>>({ changes, db, docToSaveWith, ...params })
        }
    }

    static InitFromRelation(
        props: CharacterRelationFields,
        action: "request" | "direct_update",
        addModel: (m: MediaDoc<any>[]) => void, params: Omit<UpdateParams<Character>, 'db' | 'changes'>) {

        let relationOutput: CharacterRelation[] = [];

        if (props.news) {
            for (const relation of props.news) {
                const update = this.createUpdate(relation.data, action, params);
                let model = update.returnModels()
                relationOutput.push({
                    id: model[0].id,
                    label: relation.label,
                    character: model[0].id,
                })
                addModel(model)
            }
        }

        if (props.exists) {
            for (const relation of props.exists) {
                relationOutput.push({
                    id: relation.id,
                    label: relation.label,
                    character: relation.id
                })
            }
        }

        return relationOutput;
    }
}

@InputType({ description: "Relation Character" })
class CharacterRelationAddInput {
    @Field(_ => CharacterInput)
    data!: CharacterInput;
    @Field(_ => CharacterRelationLabel, { nullable: true })
    label?: CharacterRelationLabel;
}

@InputType({ description: "Relation Character" })
class CharacterRelationExistInput {
    @Field(_ => String)
    id!: string;
    @Field(_ => CharacterRelationLabel, { nullable: true })
    label?: CharacterRelationLabel;
}

@InputType()
export class CharacterRelationFields {
    @Field(_ => [CharacterRelationAddInput])
    news?: CharacterRelationAddInput[]
    @Field(_ => [CharacterRelationExistInput])
    exists?: CharacterRelationExistInput[]
}