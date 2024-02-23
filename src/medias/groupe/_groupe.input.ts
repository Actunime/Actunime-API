import {  Field, InputType } from "type-graphql";
import { MediaDoc, UpdateParams, createUpdate } from "../../utils";
import { Groupe } from "./_groupe.type";
import { GroupeModel } from "./_groupe.model";
import { MediaRequiredFields } from "../../utils/_media.base";


@InputType()
export class GroupeRelationAddInput {
    @Field()
    name!: string;
}

@InputType({ description: "Relation Track" })
class GroupeRelationExistInput {
    @Field(_ => String)
    id!: string;
}

@InputType()
export class GroupeRelationFields {
    @Field(_ => [GroupeRelationAddInput])
    new?: GroupeRelationAddInput
    @Field(_ => GroupeRelationExistInput)
    exist?: GroupeRelationExistInput
}

@InputType()
export class GroupeInput {
    @Field()
    name!: string;


    static createUpdate(props: GroupeInput, action: "request" | "direct_update", params: Omit<UpdateParams<Groupe>, 'db' | 'changes'>) {

        const db = GroupeModel;
        let docToSaveWith: MediaDoc<Groupe>[] = [];

        let changes: Omit<Groupe, MediaRequiredFields> = props;

        if (action === 'direct_update') {
            return createUpdate<Omit<Groupe, MediaRequiredFields>>({ changes, db, docToSaveWith, ...params })
        } else {
            return createUpdate<Omit<Groupe, MediaRequiredFields>>({ changes, db, docToSaveWith, ...params })
        }
    };

    static InitFromRelation(props: GroupeRelationFields, action: "request" | "direct_update", addModel: (m: MediaDoc<Groupe>[]) => void, params: Omit<UpdateParams<Groupe>, 'db' | 'changes'>) {

        if (props.new) {
            const update = this.createUpdate(props.new, action, params);
            let model = update.returnModels()
            addModel(model)
            return {
                id: model[0].id,
                data:  model[0].id
            }
        } else
            if (props.exist)
                return {
                    id: props.exist.id,
                    data: props.exist.id
                }

        return;
    }
}