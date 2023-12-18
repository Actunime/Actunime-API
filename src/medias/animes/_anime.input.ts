import * as GraphqlType from "type-graphql";
import * as MongooseType from "@typegoose/typegoose";
import * as Medias from '../';

@GraphqlType.InputType()
class AnimeEpisodeInput {
    @GraphqlType.Field({ nullable: true })
    airing!: number;
    @GraphqlType.Field({ nullable: true })
    nextAiringDate!: Date;
    @GraphqlType.Field({ nullable: true })
    total!: number;
    @GraphqlType.Field({ nullable: true })
    durationMinutePerEp!: number;
}

enum AnimeStatus {
    INCONNU = "INCONNU",
    BIENTOT_DISPO = "BIENTÔT_DISPO",
    EN_COURS = "EN_COURS",
    EN_PAUSE = "EN_PAUSE",
    TERMINE = "TERMINÉ",
    REPPORTE = "REPPORTÉ",
    ARRETE = "ARRÉTÉ",
}

GraphqlType.registerEnumType(AnimeStatus, {
    name: "AnimeStatus",
    description: "Type de statut pour un Anime"
})


enum AnimeFormat {
    SERIE = "SÉRIE",
    FILM = "FILM",
    ONA = "ONA",
    OVA = "OVA",
}

GraphqlType.registerEnumType(AnimeFormat, {
    name: "AnimeFormat",
    description: "Type de format pour un Anime"
})

export enum AnimeSourceType {
    ORIGINAL = "ORIGINAL",
    MANGA = "MANGA",
    LIGHT_NOVEL = "LIGHT_NOVEL",
    VISUAL_NOVEL = "VISUAL_NOVEL",
    JEU = "JEU",
}

GraphqlType.registerEnumType(AnimeSourceType, {
    name: "AnimeSourceType",
    description: "Type de source pour un Anime"
})

@GraphqlType.InputType()
class AnimeSourceInput {
    @GraphqlType.Field(() => AnimeSourceType)
    origine!: AnimeSourceType
    @GraphqlType.Field({ nullable: true })
    refPubId!: string
}

@GraphqlType.InputType({ description: "Anime" })
export class AnimeInput {
    @GraphqlType.Field(() => Medias.MediaTitleInput)
    title!: Medias.MediaTitleInput

    @GraphqlType.Field(() => Medias.MediaDateInput, { nullable: true })
    date?: Medias.MediaDateInput;

    @GraphqlType.Field(() => Medias.MediaImageInput, { nullable: true })
    image?: Medias.MediaImageInput;

    @GraphqlType.Field({ nullable: true })
    synopsis?: string;

    @GraphqlType.Field(() => AnimeSourceInput)
    source!: AnimeSourceInput;

    @GraphqlType.Field(() => AnimeFormat, { nullable: true })
    format?: AnimeFormat;

    @GraphqlType.Field({ nullable: true })
    vf?: boolean

    @GraphqlType.Field(() => [String], { nullable: true })
    genres?: string[];

    @GraphqlType.Field(() => [String], { nullable: true })
    themes?: string[];

    @GraphqlType.Field(() => AnimeStatus)
    status!: AnimeStatus;

    @GraphqlType.Field(() => AnimeEpisodeInput, { nullable: true })
    episodes?: AnimeEpisodeInput;

    @GraphqlType.Field({ defaultValue: false, nullable: true })
    adult?: boolean;

    @GraphqlType.Field({ defaultValue: false, nullable: true })
    explicit?: boolean;

    @GraphqlType.Field(() => Medias.MediaLinkInput, { nullable: true })
    links?: Medias.MediaLinkInput;

    @GraphqlType.Field(() => Medias.CompanyRelationFields, { nullable: true })
    companys?: Medias.CompanyRelationFields;

    // @GraphqlType.Field(_ => [AnimeRelation])
    // @MongooseType.Prop({ type: () => [AnimeRelation] })
    // staffs?: AnimeRelation[];

    // @GraphqlType.Field(_ => [AnimeRelation])
    // @MongooseType.Prop({ type: () => [AnimeRelation] })
    // characters?: AnimeRelation[];

    // @GraphqlType.Field(_ => [AnimeRelation])
    // @MongooseType.Prop({ type: () => [AnimeRelation] })
    // tracks?: AnimeRelation[]

    async init(props: AnimeInput) {
        const media = new Medias.Anime({
            ...props,
            companys: await this.handleCompanysGraphql(props.companys)
        });
        console.log('animeinput init', media);
        return media;
    }

    public relationsMediasToSave: Medias.MediaDoc[] = [];

    private addRelationsMediasToSave(documents: Medias.MediaDoc[]) {
        this.relationsMediasToSave = this.relationsMediasToSave.concat(documents);
    }

    private async handleCompanysGraphql(props?: Medias.CompanyRelationFields): Promise<Medias.CompanyRelation[]> {
        if (!props) return [];

        const newCompanys = await Promise.all(props.news.map(async (newCompany) => {
            return await new Medias.CompanyInput().init(newCompany.data);
        }))

        const oldCompanys = await Promise.all(props.exists.map(async (existCompany) => {
            const company = await Medias.CompanyModel.findOne({ pubId: existCompany.pubId });
            if (!company) throw `La société avec l'identifiant ${existCompany.pubId} n'existe pas.`;
            return company._id
        }))


        this.addRelationsMediasToSave(newCompanys.map((d) => d.doc));

        const companysIds = [...newCompanys.map((doc) => doc.doc._id), ...oldCompanys];

        return companysIds.map((id) => ({ data: id }));
    }
}
