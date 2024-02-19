
import { Field, InputType } from 'type-graphql';
import { MediaRequiredFields } from '../../utils/_media.base';
import { MangaModel } from './_manga.model';
import { Manga } from './_manga.type';
import { MediaTitleInput, MediaDateInput, MediaImageInput, MediaLinkInput, MediaDoc, createUpdate, UpdateParams } from '../../utils';
import { DefaultMangaFormatEnum, DefaultSourceEnum, DefaultStatusEnum, GenresEnum } from '../defaultData';
import { CharacterInput, CharacterRelationFields } from '../characters/_character.input';
import { CompanyInput, CompanyRelationFields } from '../companys/_company.input';
import { PersonInput, PersonRelationFields } from '../persons/_person.input';
import { GroupeInput, GroupeRelationFields } from '../groupe/_groupe.input';

@InputType()
class MangaChapterInput {
    @Field({ nullable: true })
    airing!: number;
    @Field({ nullable: true })
    nextAiringDate?: Date;
    @Field({ nullable: true })
    total!: number;
}

@InputType()
class MangaVolumeInput {
    @Field({ nullable: true })
    name!: string;
    @Field({ nullable: true })
    num?: number;
    @Field({ nullable: true })
    pubDate!: Date;
    @Field({ nullable: true })
    image!: string;
}

@InputType()
class MangaSourceRelationInput {
    @Field(() => DefaultSourceEnum)
    origine!: DefaultSourceEnum
    // @Field({ nullable: true }) // Euh cas de figure a voir...
    // id?: string
}

@InputType({ description: "Manga" })
export class MangaInput {
    @Field(() => GroupeRelationFields)
    groupe?: GroupeRelationFields

    @Field({ nullable: true })
    parent?: string

    @Field(() => MediaTitleInput)
    title!: MediaTitleInput

    @Field(() => MediaDateInput, { nullable: true })
    date?: MediaDateInput;

    @Field(() => MediaImageInput, { nullable: true })
    image?: MediaImageInput;

    @Field({ nullable: true })
    synopsis?: string;

    @Field(() => MangaSourceRelationInput)
    source?: MangaSourceRelationInput;

    @Field(() => DefaultMangaFormatEnum, { nullable: true })
    format?: DefaultMangaFormatEnum;

    @Field(() => [GenresEnum], { nullable: true })
    genres?: GenresEnum[];

    @Field(() => [String], { nullable: true })
    themes?: string[];

    @Field(() => DefaultStatusEnum)
    status!: DefaultStatusEnum;

    @Field(() => MangaChapterInput, { nullable: true })
    chapters?: MangaChapterInput;

    @Field(() => [MangaVolumeInput], { nullable: true })
    volumes?: MangaVolumeInput[]

    @Field({ defaultValue: false, nullable: true })
    adult?: boolean;

    @Field({ defaultValue: false, nullable: true })
    explicit?: boolean;

    @Field(() => [MediaLinkInput], { nullable: true })
    links?: MediaLinkInput[];

    @Field(() => CompanyRelationFields, { nullable: true })
    companys?: CompanyRelationFields;

    @Field(_ => PersonRelationFields, { nullable: true })
    staffs?: PersonRelationFields;

    @Field(_ => CharacterRelationFields)
    characters?: CharacterRelationFields

    static async createUpdate(props: MangaInput, action: "request" | "direct_update", params: Omit<UpdateParams<Manga>, 'db' | 'changes'>) {

        const db = MangaModel;
        let docToSaveWith: MediaDoc<any>[] = [];

        let changes: Omit<Manga, MediaRequiredFields> = {
            ...props,
            parent: props.parent ? { id: props.parent } : undefined,
            groupe: props.groupe ? GroupeInput.InitFromRelation(props.groupe, action, (m) => docToSaveWith = docToSaveWith.concat(m), params) : undefined,
            companys: props.companys ? CompanyInput.InitFromRelation(props.companys, action, (m) => docToSaveWith = docToSaveWith.concat(m), params) : undefined,
            staffs: props.staffs ? PersonInput.InitFromRelation(props.staffs, action, (m) => docToSaveWith = docToSaveWith.concat(m), params) : undefined,
            characters: props.characters ? CharacterInput.InitFromRelation(props.characters, action, (m) => docToSaveWith = docToSaveWith.concat(m), params) : undefined,
        };

        if (action === 'direct_update') {
            return createUpdate<Omit<Manga, MediaRequiredFields>>({ changes, db, docToSaveWith, ...params })
        } else {
            return createUpdate<Omit<Manga, MediaRequiredFields>>({ changes, db, docToSaveWith, ...params })
        }
    }
}