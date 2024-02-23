
import { Field, InputType } from "type-graphql";
import { MediaLinkInput } from "../../utils/_media.types";
import { Company, CompanyLabel, } from "./_company.type";
import { CompanyModel, CompanyRelation } from "./_company.model";
import { MediaDoc, UpdateParams, createUpdate } from "../../utils/_createUpdate";
import { MediaRequiredFields } from "../../utils/_media.base";



@InputType()
export class CompanyInput implements Partial<Company> {
    @Field(t => CompanyLabel)
    label!: CompanyLabel

    @Field()
    name!: string

    @Field(t => [MediaLinkInput])
    links?: MediaLinkInput[]

    @Field()
    createdDate?: Date

    static createUpdate(props: CompanyInput, action: "request" | "direct_update", params: Omit<UpdateParams<Company>, 'db' | 'changes'>) {

        const db = CompanyModel;
        let docToSaveWith: MediaDoc<any>[] = [];

        let changes: Omit<Company, MediaRequiredFields> = { ...props };

        if (action === 'direct_update') {
            return createUpdate<Omit<Company, MediaRequiredFields>>({ changes, db, docToSaveWith, ...params })
        } else {
            return createUpdate<Omit<Company, MediaRequiredFields>>({ changes, db, docToSaveWith, ...params })
        }
    }

    static InitFromRelation(props: CompanyRelationFields, action: "request" | "direct_update", addModel: (m: MediaDoc<any>[]) => void, params: Omit<UpdateParams<Company>, 'db' | 'changes'>) {

        let relationOutput: CompanyRelation[] = [];

        if (props.news) {
            for (const relation of props.news) {
                const update = this.createUpdate(relation.data, action, params);
                let model = update.returnModels()
                relationOutput.push({
                    id: model[0].id,
                    company: model[0].id
                })
                addModel(model)
            }
        }

        if (props.exists) {
            for (const relation of props.exists) {
                relationOutput.push({
                    id: relation.id,
                    company: relation.id
                })
            }
        }

        return relationOutput;
    }
}

@InputType({ description: "Relation Company, ajouter une nouvelle société en même temps qu'un nouveau media." })
class CompanyRelationAddInput {
    @Field(_ => CompanyInput)
    data!: CompanyInput;
}

@InputType({ description: "Relation Company, ajouter une société a un nouveau media." })
class CompanyRelationExistInput {
    @Field(_ => String)
    id!: string;
}

@InputType()
export class CompanyRelationFields {
    @Field(_ => [CompanyRelationAddInput])
    news?: CompanyRelationAddInput[]
    @Field(_ => [CompanyRelationExistInput])
    exists?: CompanyRelationExistInput[]
}
