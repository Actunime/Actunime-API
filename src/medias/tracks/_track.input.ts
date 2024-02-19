
import { Field, InputType, registerEnumType } from "type-graphql";
import { MediaLinkInput } from "../../utils/_media.types";
import { MediaDoc, UpdateParams, createUpdate } from "../../utils";
import { TrackModel } from "./_track.model";
import { Track, TrackLabelRelation, TrackRelation } from "./_track.type";
import { PersonInput, PersonRelationFields } from "../persons/_person.input";
import { MediaRequiredFields } from "../../utils/_media.base";

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

    static createUpdate(props: TrackInput, action: "request" | "direct_update", params: Omit<UpdateParams<Track>, 'db' | 'changes'>) {

        const db = TrackModel;
        let docToSaveWith: MediaDoc<any>[] = [];

        let changes: Omit<Track, MediaRequiredFields> = {
            ...props,
            artists: props.artists ? PersonInput.InitFromRelation(props.artists, action, (m) => docToSaveWith = docToSaveWith.concat(m), params) : undefined
        };

        if (action === 'direct_update') {
            return createUpdate<Omit<Track, MediaRequiredFields>>({ changes, db, docToSaveWith, ...params })
        } else {
            return createUpdate<Omit<Track, MediaRequiredFields>>({ changes, db, docToSaveWith, ...params })
        }
    }

    static InitFromRelation(
        props: TrackRelationFields,
        action: "request" | "direct_update",
        addModel: (m: MediaDoc<any>[]) => void, params: Omit<UpdateParams<Track>, 'db' | 'changes'>) {

        let relationOutput: TrackRelation[] = [];

        if (props.news) {
            for (const relation of props.news) {
                const update = this.createUpdate(relation.data, action, params);
                let model = update.returnModels()
                relationOutput.push({
                    id: model[0].id,
                    label: relation.label,
                    data: null
                })
                addModel(model)
            }
        }

        if (props.exists) {
            for (const relation of props.exists) {
                relationOutput.push({
                    id: relation.id,
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
    label?: TrackLabelRelation;

    @Field(type => [Number], { nullable: true })
    episodes?: number[];

    @Field(_ => TrackInput)
    data!: TrackInput;
}

@InputType({ description: "Relation Track" })
class TrackRelationExistInput {
    @Field(_ => String)
    id!: string;

    @Field({ nullable: true })
    label?: TrackLabelRelation;

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
