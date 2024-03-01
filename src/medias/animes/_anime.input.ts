
import { Field, InputType } from 'type-graphql';
import { MediaRequiredFields } from '../../utils/_media.base';
import { Anime, AnimeModel } from './_anime.type';
import { MediaTitleInput, MediaDateInput, MediaImageInput, MediaLinkInput, MediaDoc, createUpdate, UpdateParams } from '../../utils';
import { DefaultAnimeFormatEnum, DefaultSourceEnum, DefaultStatusEnum, GenresEnum } from '../defaultData';
import { CharacterInput, CharacterRelationFields } from '../characters/_character.input';
import { CompanyInput, CompanyRelationFields } from '../companys/_company.input';
import { PersonInput, PersonRelationFields } from '../persons/_person.input';
import { GroupeInput, GroupeRelationFields } from '../groupe/_groupe.input';
import { TrackInput, TrackRelationFields } from '../tracks/_track.input';

@InputType()
class AnimeEpisodeInput {
    @Field({ nullable: true })
    airing!: number;
    @Field({ nullable: true })
    nextAiringDate?: Date;
    @Field({ nullable: true })
    total!: number;
    @Field({ nullable: true })
    durationMinutePerEp?: number;
}

@InputType()
class AnimeSourceRelationInput {
    @Field(() => DefaultSourceEnum)
    origine!: DefaultSourceEnum
    @Field({ nullable: true })
    id?: string
}

@InputType({ description: "Anime" })
export class AnimeInput {
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

    @Field(() => AnimeSourceRelationInput)
    source?: AnimeSourceRelationInput;

    @Field(() => DefaultAnimeFormatEnum, { nullable: true })
    format?: DefaultAnimeFormatEnum;

    @Field({ nullable: true })
    vf?: boolean

    @Field(() => [GenresEnum], { nullable: true })
    genres?: GenresEnum[];

    @Field(() => [String], { nullable: true })
    themes?: string[];

    @Field(() => DefaultStatusEnum)
    status!: DefaultStatusEnum;

    @Field(() => AnimeEpisodeInput, { nullable: true })
    episodes?: AnimeEpisodeInput;

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

    @Field(_ => TrackRelationFields)
    tracks?: TrackRelationFields

    static async createUpdate(props: AnimeInput, action: "request" | "direct_update", params: Omit<UpdateParams<Anime>, 'db' | 'changes'>) {

        const db = AnimeModel;
        let docToSaveWith: MediaDoc<any>[] = [];

        let changes: Omit<Anime, MediaRequiredFields> = {
            ...props,
            parent: props.parent ? { id: props.parent, anime: props.parent } : undefined,
            groupe: props.groupe ? GroupeInput.InitFromRelation(props.groupe, action, (m) => docToSaveWith = docToSaveWith.concat(m), params) : undefined,
            companys: props.companys ? CompanyInput.InitFromRelation(props.companys, action, (m) => docToSaveWith = docToSaveWith.concat(m), params) : undefined,
            staffs: props.staffs ? PersonInput.InitFromRelation(props.staffs, action, (m) => docToSaveWith = docToSaveWith.concat(m), params) : undefined,
            characters: props.characters ? CharacterInput.InitFromRelation(props.characters, action, (m) => docToSaveWith = docToSaveWith.concat(m), params) : undefined,
            tracks: props.tracks ? TrackInput.InitFromRelation(props.tracks, action, (m) => docToSaveWith = docToSaveWith.concat(m), params) : undefined,
        };

        if (action === 'direct_update') {
            return createUpdate<Omit<Anime, MediaRequiredFields>>({ changes, db, docToSaveWith, ...params })
        } else {
            return createUpdate<Omit<Anime, MediaRequiredFields>>({ changes, db, docToSaveWith, ...params })
        }
    }
}