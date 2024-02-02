
import { Field, InputType } from "type-graphql";
import { MediaLinkInput } from "../../utils/_media.types";
import { MediaUpdateOptionArg } from "../../utils/_media.update";
import { PersonInput, PersonRelationFields } from "../persons/_person.input";
import { MediaDoc, createUpdate } from "../../utils";
import { TrackModel } from "./_track.model";
import { Track, TrackRelation } from "./_track.type";

@InputType()
export class TrackInput {

    @Field()
    name!: string

    @Field(type => [MediaLinkInput])
    links?: MediaLinkInput[]

    @Field()
    outDate?: Date;

    @Field()
    image?: string;

    @Field(type => PersonRelationFields)
    artists?: PersonRelationFields;

    static createUpdate(props: TrackInput, action: "request" | "direct_update", visible: boolean) {

        const db = TrackModel;
        let docToSaveWith: MediaDoc[] = [];

        let media: Track = {
            ...props,
            artists: props.artists ? PersonInput.InitFromRelation(props.artists, action, (m) => docToSaveWith = docToSaveWith.concat(m)) : undefined
        };

        if (action === 'direct_update') {
            return createUpdate<Track>({ media, db, visible, docToSaveWith })
        } else {
            return createUpdate<Track>({ media, db, visible, docToSaveWith })
        }
    }

    static InitFromRelation(
        props: TrackRelationFields,
        action: "request" | "direct_update",
        addModel: (m: MediaDoc[]) => void) {

        let relationOutput: TrackRelation[] = [];

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

@InputType({ description: "Relation Track" })
class TrackRelationAddInput {

    @Field({ nullable: true })
    label?: string;

    @Field(type => [Number], { nullable: true })
    episodes?: number[];

    @Field(_ => TrackInput)
    data!: TrackInput;

    @Field(_ => MediaUpdateOptionArg, { nullable: true })
    options?: MediaUpdateOptionArg
}

@InputType({ description: "Relation Track" })
class TrackRelationExistInput {
    @Field(_ => String)
    pubId!: string;

    @Field({ nullable: true })
    label?: string;

    @Field(type => [Number], { nullable: true })
    episodes?: number[];
}

@InputType()
export class TrackRelationFields {
    @Field(_ => [TrackRelationAddInput])
    news?: TrackRelationAddInput[]
    @Field(_ => [TrackRelationExistInput])
    exists?: TrackRelationExistInput[]
}
