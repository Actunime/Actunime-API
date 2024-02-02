import { Field, InputType } from "type-graphql";
// import { HandlerInputOnly, InputHandler } from "../../utils/_inputHandler";
import { Person, PersonRelation } from './_person.type';
import { MediaLinkInput, MediaPersonGender, MediaPersonOrCharacterNameInput } from "../../utils/_media.types";
import { MediaUpdateOptionArg } from "../../utils/_media.update";
import { PersonModel } from "./_person.model";
import { MediaDoc, createUpdate } from "../../utils";


@InputType()
export class PersonInput implements Partial<Person> {
    
    // @Field(type => PersonLabel)
    // label!: PersonLabel

    @Field(t => MediaPersonOrCharacterNameInput)
    name!: MediaPersonOrCharacterNameInput

    @Field()
    age?: number

    @Field()
    birthDate?: string

    @Field(type => MediaPersonGender)
    gender?: MediaPersonGender;

    @Field()
    bio?: string

    @Field()
    image?: string

    @Field(t => [MediaLinkInput])
    links?: MediaLinkInput[]


    static createUpdate(props: PersonInput, action: "request" | "direct_update", visible: boolean) {

        const db = PersonModel;
        let docToSaveWith: MediaDoc[] = [];

        let media: Person = { ...props };

        if (action === 'direct_update') {
            return createUpdate<Person>({ media, db, visible, docToSaveWith })
        } else {
            return createUpdate<Person>({ media, db, visible, docToSaveWith })
        }
    }

    static InitFromRelation(
        props: PersonRelationFields,
        action: "request" | "direct_update",
        addModel: (m: MediaDoc[]) => void) {

        let relationOutput: PersonRelation[] = [];

        if (props.news) {
            for (const relation of props.news) {
                const update = this.createUpdate(relation.data, action, relation.options?.visible === undefined ? true : false);
                let model = update.returnModels()
                relationOutput.push({
                    pubId: model[0].pubId,
                    label: relation.label,
                    data: null
                })
                addModel(model)
            }
        }

        if (props.exists) {
            for (const relation of props.exists) {
                relationOutput.push({
                    pubId: relation.pubId,
                    label: relation.label,
                    data: null
                })
            }
        }

        return relationOutput;
    }
}

@InputType()
export class PersonSearchQuery {
    @Field()
    title!: string;
}

@InputType({ description: "Relation Person, ajouter une nouvelle société en même temps qu'un nouveau media." })
class PersonRelationAddInput {
    @Field(_ => PersonInput)
    data!: PersonInput;
    @Field()
    label!: string;
    @Field(_ => MediaUpdateOptionArg, { nullable: true })
    options?: MediaUpdateOptionArg
}

@InputType({ description: "Relation Person, ajouter une société a un nouveau media." })
class PersonRelationExistInput {
    @Field(_ => String)
    pubId!: string;
    @Field()
    label!: string;
}

@InputType()
export class PersonRelationFields {
    @Field(_ => [PersonRelationAddInput])
    news?: PersonRelationAddInput[]
    @Field(_ => [PersonRelationExistInput])
    exists?: PersonRelationExistInput[]
}
