
import { Field, InputType } from 'type-graphql';
import { CharacterInput, CharacterRelationFields } from '../characters/_character.input';
import { Anime } from './_anime.type';
import { MediaTitleInput, MediaDateInput, MediaImageInput, MediaLinkInput, MediaDoc, createUpdate } from '../../utils';
import { CompanyInput, CompanyRelationFields } from '../companys/_company.input';
import { PersonInput, PersonRelationFields } from '../persons/_person.input';
import { TrackInput, TrackRelationFields } from '../tracks/_track.input';
import { AnimeModel } from './_anime.model';
import { DefaultAnimeFormatEnum, DefaultSourceEnum, DefaultStatusEnum, GenresEnum } from '../defaultData';


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
class AnimeSourceInput {
    @Field(() => DefaultSourceEnum)
    origine!: DefaultSourceEnum
    @Field({ nullable: true })
    refPubId?: string
}

@InputType({ description: "Anime" })
export class AnimeInput {
    @Field(() => MediaTitleInput)
    title!: MediaTitleInput

    @Field(() => MediaDateInput, { nullable: true })
    date?: MediaDateInput;

    @Field(() => MediaImageInput, { nullable: true })
    image?: MediaImageInput;

    @Field({ nullable: true })
    synopsis?: string;

    @Field(() => AnimeSourceInput)
    source?: AnimeSourceInput;

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

    @Field(() => MediaLinkInput, { nullable: true })
    links?: MediaLinkInput[];

    @Field(() => CompanyRelationFields, { nullable: true })
    companys?: CompanyRelationFields;

    @Field(_ => PersonRelationFields, { nullable: true })
    staffs?: PersonRelationFields;

    @Field(_ => CharacterRelationFields)
    characters?: CharacterRelationFields

    @Field(_ => TrackRelationFields)
    tracks?: TrackRelationFields

    static async createUpdate(props: AnimeInput, action: "request" | "direct_update", visible: boolean) {

        const db = AnimeModel;
        let docToSaveWith: MediaDoc[] = [];

        let media: Anime = {
            ...props,
            companys: props.companys ? CompanyInput.InitFromRelation(props.companys, action, (m) => docToSaveWith = docToSaveWith.concat(m)) : undefined,
            staffs: props.staffs ? PersonInput.InitFromRelation(props.staffs, action, (m) => docToSaveWith = docToSaveWith.concat(m)) : undefined,
            characters: props.characters ? CharacterInput.InitFromRelation(props.characters, action, (m) => docToSaveWith = docToSaveWith.concat(m)) : undefined,
            tracks: props.tracks ? TrackInput.InitFromRelation(props.tracks, action, (m) => docToSaveWith = docToSaveWith.concat(m)) : undefined,
        };

        if (action === 'direct_update') {
            return createUpdate<Anime>({ media, db, visible, docToSaveWith })
        } else {
            return createUpdate<Anime>({ media, db, visible, docToSaveWith })
        }
    }
}
