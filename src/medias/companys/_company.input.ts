
import { Field, InputType } from "type-graphql";
import { MediaLinkInput } from "../../utils/_media.types";
import { MediaUpdateOptionArg } from "../../utils/_media.update";
import { Company, CompanyLabel, CompanyRelation } from "./_company.type";
import { CompanyModel } from "./_company.model";
import { MediaDoc, createUpdate } from "../../utils/_createUpdate";



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

    static createUpdate(props: CompanyInput, action: "request" | "direct_update", visible: boolean) {

        const db = CompanyModel;
        let docToSaveWith: MediaDoc[] = [];

        let media: Company = { ...props };

        if (action === 'direct_update') {
            return createUpdate<Company>({ media, db, visible, docToSaveWith })
        } else {
            return createUpdate<Company>({ media, db, visible, docToSaveWith })
        }
    }

    static InitFromRelation(props: CompanyRelationFields, action: "request" | "direct_update", addModel: (m: MediaDoc[]) => void) {

        let relationOutput: CompanyRelation[] = [];

        if (props.news) {
            for (const relation of props.news) {
                const update = this.createUpdate(relation.data, action, relation.options?.visible === undefined ? true : false);
                let model = update.returnModels()
                relationOutput.push({
                    pubId: model[0].pubId,
                    data: null
                })
                addModel(model)
            }
        }

        if (props.exists) {
            for (const relation of props.exists) {
                relationOutput.push({
                    pubId: relation.pubId,
                    data: null
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
    @Field(_ => MediaUpdateOptionArg, { nullable: true })
    options?: MediaUpdateOptionArg
}

@InputType({ description: "Relation Company, ajouter une société a un nouveau media." })
class CompanyRelationExistInput {
    @Field(_ => String)
    pubId!: string;
}

@InputType()
export class CompanyRelationFields {
    @Field(_ => [CompanyRelationAddInput])
    news?: CompanyRelationAddInput[]
    @Field(_ => [CompanyRelationExistInput])
    exists?: CompanyRelationExistInput[]
}
