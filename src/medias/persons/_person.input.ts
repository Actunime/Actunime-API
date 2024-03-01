import { Field, InputType } from "type-graphql";
// import { HandlerInputOnly, InputHandler } from "../../utils/_inputHandler";
import { Person, PersonrRoleRelationLabel } from './_person.type';
import { MediaLinkInput, MediaPersonGender, MediaPersonOrCharacterNameInput } from "../../utils/_media.types";
import { PersonModel, PersonRelation } from "./_person.model";
import { MediaDoc, UpdateParams, createUpdate } from "../../utils";
import { MediaRequiredFields } from "../../utils/_media.base";

@InputType()
export class PersonInput implements Partial<Person> {

    // @Field(type => PersonLabel)
    // label!: PersonLabel

    @Field(t => MediaPersonOrCharacterNameInput)
    name!: MediaPersonOrCharacterNameInput;

    @Field()
    age?: number;

    @Field()
    birthDate?: string;

    @Field(type => MediaPersonGender)
    gender?: MediaPersonGender;

    @Field()
    bio?: string

    @Field()
    image?: string

    @Field(t => [MediaLinkInput])
    links?: MediaLinkInput[]

    static createUpdate(props: PersonInput, action: "request" | "direct_update", params: Omit<UpdateParams<Person>, 'db' | 'changes'>) {

        const db = PersonModel;
        let docToSaveWith: MediaDoc<any>[] = [];

        let changes: Omit<Person, MediaRequiredFields> = { ...props };

        if (action === 'direct_update') {
            return createUpdate<Omit<Person, MediaRequiredFields>>({ changes, db, docToSaveWith, ...params })
        } else {
            return createUpdate<Omit<Person, MediaRequiredFields>>({ changes, db, docToSaveWith, ...params })
        }
    }

    static InitFromRelation(
        props: PersonRelationFields,
        action: "request" | "direct_update",
        addModel: (m: MediaDoc<any>[]) => void, params: Omit<UpdateParams<Person>, 'db' | 'changes'>) {

        let relationOutput: PersonRelation[] = [];

        if (props.news) {
            for (const relation of props.news) {
                const update = this.createUpdate(relation.data, action, params);
                let model = update.returnModels()
                relationOutput.push({
                    id: model[0].id,
                    label: relation.label,
                    person: model[0].id
                })
                addModel(model)
            }
        }

        if (props.exists) {
            for (const relation of props.exists) {
                relationOutput.push({
                    id: relation.id,
                    label: relation.label,
                    person: relation.id
                })
            }
        }

        return relationOutput;
    }
}

@InputType({ description: "Relation Person, ajouter une nouvelle société en même temps qu'un nouveau media." })
class PersonRelationAddInput {
    @Field(_ => PersonInput)
    data!: PersonInput;
    @Field(_ => PersonrRoleRelationLabel, { nullable: true })
    label!: PersonrRoleRelationLabel;
}

@InputType({ description: "Relation Person, ajouter une société a un nouveau media." })
class PersonRelationExistInput {
    @Field(_ => String)
    id!: string;
    @Field(_ => PersonrRoleRelationLabel, { nullable: true })
    label!: PersonrRoleRelationLabel;
}

@InputType()
export class PersonRelationFields {
    @Field(_ => [PersonRelationAddInput])
    news?: PersonRelationAddInput[]
    @Field(_ => [PersonRelationExistInput])
    exists?: PersonRelationExistInput[]
}