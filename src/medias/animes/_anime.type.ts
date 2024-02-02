import * as MongooseType from "@typegoose/typegoose";
import * as GraphqlType from "type-graphql";
import { registerEnumType } from "type-graphql";
import { MediaTitle, MediaDate, MediaLink, MediaImage, MediaSearchLogic } from "../../utils/_media.types";
import { CharacterRelation } from "../characters/_character.type";
import { CompanyRelation } from "../companys/_company.type";
import { PersonRelation } from "../persons/_person.type";
import { TrackRelation } from "../tracks/_track.type";
import { Groupe, GroupeRelation } from "../groupe";
import { FilterQuery } from "mongoose";
import { GraphQLScalarType } from "graphql/type";
import { Kind } from "graphql";
import { DataVirtual } from "../../utils";
import { DefaultAnimeFormatEnum, DefaultSourceEnum, DefaultStatusEnum, GenresEnum } from "../defaultData";
import themes from '../defaultFiles/themes.json';

/** Anime part types */
@GraphqlType.ObjectType()
@MongooseType.ModelOptions({ schemaOptions: { _id: false } })
class AnimeEpisode {
    // @GraphqlType.Field({ nullable: true }) @MongooseType.Prop()
    @GraphqlType.Field({ nullable: true })
    @MongooseType.Prop()
    airing?: number;

    @GraphqlType.Field({ nullable: true })
    @MongooseType.Prop()
    nextAiringDate?: Date;

    @GraphqlType.Field({ nullable: true })
    @MongooseType.Prop()
    total?: number;

    @GraphqlType.Field({ nullable: true })
    @MongooseType.Prop()
    durationMinutePerEp?: number;
}

@GraphqlType.ObjectType()
@MongooseType.ModelOptions({ schemaOptions: { _id: false } })
class AnimeSource {
    @GraphqlType.Field(() => DefaultSourceEnum)
    @MongooseType.Prop({ enum: DefaultSourceEnum })
    origine!: DefaultSourceEnum
    @GraphqlType.Field({ nullable: true })
    @MongooseType.Prop()
    refPubId?: string
}

/** Anime type */
@GraphqlType.ObjectType({ description: "Anime" })
@MongooseType.ModelOptions({ schemaOptions: { _id: false, toJSON: { virtuals: true } } })
export class Anime {
    // _id?: Types.ObjectId

    @GraphqlType.Field()
    @MongooseType.Prop()
    id?: string;

    // @GraphqlType.Field({ nullable: true })
    // @MongooseType.Prop()
    // pubId?: string;

    @GraphqlType.Field(_ => GroupeRelation, { nullable: true })
    @MongooseType.Prop({ ref: 'Groupe', refPath: 'pubId' })
    groupe?: string | GroupeRelation;

    @GraphqlType.Field(_ => AnimeRelation, { nullable: true })
    @MongooseType.Prop({ ref: 'Anime', refPath: 'pubId' })
    parent?: string | AnimeRelation;

    @GraphqlType.Field(_ => MediaTitle, { nullable: true })
    @MongooseType.Prop({ default: undefined })
    title?: MediaTitle

    @GraphqlType.Field(_ => MediaDate, { nullable: true })
    @MongooseType.Prop({ default: undefined })
    date?: MediaDate;

    @GraphqlType.Field(_ => MediaImage, { nullable: true })
    @MongooseType.Prop({ default: undefined })
    image?: MediaImage;

    @GraphqlType.Field({ nullable: true })
    @MongooseType.Prop({ default: undefined })
    synopsis?: string;

    @GraphqlType.Field(() => AnimeSource, { nullable: true })
    @MongooseType.Prop({ type: AnimeSource, default: undefined })
    source?: AnimeSource;

    @GraphqlType.Field(_ => DefaultAnimeFormatEnum, { nullable: true })
    @MongooseType.Prop({ enum: DefaultAnimeFormatEnum, default: undefined })
    format?: DefaultAnimeFormatEnum;

    @GraphqlType.Field({ nullable: true })
    @MongooseType.Prop({ default: undefined })
    vf?: boolean

    @GraphqlType.Field(_ => [GenresEnum], { nullable: true })
    @MongooseType.Prop({ type: () => [String], default: undefined })
    genres?: GenresEnum[];

    @GraphqlType.Field(_ => [String], { nullable: true })
    @MongooseType.Prop({ type: () => [String], default: undefined, validate: (v: string) => themes.find((x) => x.value === v) ? true : false })
    themes?: string[];

    @GraphqlType.Field(_ => DefaultStatusEnum, { nullable: true })
    @MongooseType.Prop({ enum: DefaultStatusEnum, default: undefined })
    status?: DefaultStatusEnum;

    @GraphqlType.Field(t => AnimeEpisode, { nullable: true })
    @MongooseType.Prop({ type: AnimeEpisode })
    episodes?: AnimeEpisode;

    @GraphqlType.Field({ nullable: true })
    @MongooseType.Prop({ default: undefined })
    adult?: boolean;

    @GraphqlType.Field({ nullable: true })
    @MongooseType.Prop({ default: undefined })
    explicit?: boolean;

    @GraphqlType.Field(t => [MediaLink], { nullable: true })
    @MongooseType.Prop({ type: [MediaLink], default: undefined })
    links?: MediaLink[];

    @GraphqlType.Field(_ => [CompanyRelation], { nullable: true })
    @MongooseType.Prop({ type: () => [CompanyRelation], default: undefined })
    companys?: CompanyRelation[];

    @GraphqlType.Field(_ => [PersonRelation], { nullable: true })
    @MongooseType.Prop({ type: () => [PersonRelation], default: undefined })
    staffs?: PersonRelation[];

    @GraphqlType.Field(_ => [CharacterRelation], { nullable: true })
    @MongooseType.Prop({ type: [CharacterRelation], default: undefined })
    characters?: CharacterRelation[];

    @GraphqlType.Field(_ => [TrackRelation], { nullable: true })
    @MongooseType.Prop({ type: () => [TrackRelation], default: undefined })
    tracks?: TrackRelation[]
}



enum Season {
    HIVER = "HIVER",
    AUTOMNE = "AUTOMNE",
    ETE = "ÉTÉ",
    PRINTEMPS = "PRINTEMPS"
}

registerEnumType(Season, {
    name: "Season",
    description: "Les différentes saisons de l'année"
})


@GraphqlType.InputType()
export class AnimeSearchQuery {
    @GraphqlType.Field({ nullable: true })
    groupe?: string; // Groupe id

    @GraphqlType.Field({ nullable: true })
    parent?: string; // parent Id

    @GraphqlType.Field({ nullable: true })
    title?: string // MediaTitle

    @GraphqlType.Field(() => Season, { nullable: true })
    season?: Season

    @GraphqlType.Field({ nullable: true })
    year?: number

    @GraphqlType.Field(() => DefaultSourceEnum, { nullable: true })
    source?: DefaultSourceEnum;

    @GraphqlType.Field({ nullable: true })
    format?: string;

    @GraphqlType.Field({ nullable: true })
    vf?: boolean

    @GraphqlType.Field(_ => [String], { nullable: true })
    genres?: string[];

    @GraphqlType.Field(_ => [String], { nullable: true })
    themes?: string[];

    @GraphqlType.Field({ nullable: true })
    status?: string;

    @GraphqlType.Field({ nullable: true })
    minEpisodes?: number;

    @GraphqlType.Field({ nullable: true })
    adult?: boolean;

    @GraphqlType.Field({ nullable: true })
    explicit?: boolean;

    @GraphqlType.Field({ nullable: true })
    company?: string; // company Id

    @GraphqlType.Field({ nullable: true })
    staff?: string; // staff id

    @GraphqlType.Field({ nullable: true })
    character?: string; // character id

    @GraphqlType.Field({ nullable: true })
    track?: string; // track id


    static genQuery(this: MongooseType.types.QueryHelperThis<GraphqlType.ClassType<Anime>, CustomQuery>, props: AnimeSearchQuery, logic: MediaSearchLogic) {

        let query: FilterQuery<Anime>[] = [];
        if (props.title)
            this.or([
                { "data.title.default": new RegExp(props.title, 'i') },
                { "data.title.romaji": new RegExp(props.title, 'i') },
                { "data.title.native": new RegExp(props.title, 'i') },
                { "data.title.alias": new RegExp(props.title, 'i') },
            ])

        if (props.groupe)
            query.push({ 'data.groupe': props.groupe })

        if (props.parent)
            query.push({ 'data.parent': props.parent })

        if (props.season) {
            const date = new Date();
            const month = date.getMonth();
            function getMonths() {
                let months = [];
                switch (props.season) {
                    case 'HIVER':
                        for (let i = 1; i < 12; i++) {
                            if (i >= 11 || i <= 2) {
                                months.push(i)
                            }
                        }
                        break;
                    case 'PRINTEMPS':
                        for (let i = 1; i < 12; i++) {
                            if (i <= 6 && i > 2) {
                                months.push(i)
                            }
                        }
                        break;
                    case 'ÉTÉ':
                        for (let i = 1; i < 12; i++) {
                            if (i >= 5 && i <= 7) {
                                months.push(i)
                            }
                        }
                        break;

                    case 'AUTOMNE':
                        for (let i = 1; i < 12; i++) {
                            if (i >= 8 && i <= 10) {
                                months.push(i)
                            }
                        }
                        break;
                    default:
                        throw "Saison non reconnu";
                }
                return months;
            }

            let months = getMonths()

            let mQuery = []

            for (let i = 0; i < months.length; i++) {
                const m = months[i];
                mQuery.push({ 'data.date.startMonth': m })
            }

            if (mQuery.length)
                query.push({ 'data.date.start': { $exists: true } })

            this.or(mQuery)
        }

        if (props.year)
            query.push({ 'data.date.start': { $gte: new Date(props.year, 0, 0), $lt: new Date(props.year + 1, 0, 0) } })

        if (props.source)
            query.push({ 'data.groupe.origine': props.source })

        if (props.format)
            query.push({ 'data.format': props.format })

        if (props.vf)
            query.push({ 'data.vf': props.vf })

        if (props.genres)
            query.push({ 'data.genres': { $in: props.genres } })

        if (props.themes)
            query.push({ 'data.themes': { $in: props.themes } })

        if (props.status)
            query.push({ 'data.status': props.status })

        if (props.minEpisodes)
            query.push({ 'data.episodes.airing': { $gt: props.minEpisodes } })

        if (props.adult)
            query.push({ 'data.adult': props.adult })


        if (props.explicit)
            query.push({ 'data.explicit': props.explicit })

        if (props.company)
            query.push({ 'data.companys.pubId': props.company })

        if (props.staff)
            query.push({ 'data.staffs.pubId': props.staff })

        if (props.character)
            query.push({ 'data.characters.pubId': props.character })

        if (props.track)
            query.push({ 'data.tracks.pubId': props.track })

        switch (logic) {
            case MediaSearchLogic.OR:
                if (query.length) this.or(query)
                break;

            case MediaSearchLogic.AND:
                if (query.length) this.and(query)
                break;

            default:
                if (query.length) this.or(query)
                break;
        }

        console.log('query', this.getQuery())

        return this;
    }

    static genProjection(props: AnimeSearchQuery) {
        let projections: { [key: string]: any } = {};
        if (props.season) {
            Object.assign(projections,
                {
                    'data.date.start': 1,
                    'data.date.startMonth': { $month: '$data.date.start' }
                }
            )
        }
        return projections;
    }
}

export interface CustomQuery {
    genQuery: MongooseType.types.AsQueryMethod<typeof AnimeSearchQuery.genQuery>;
}


@GraphqlType.ObjectType()
@MongooseType.modelOptions({ schemaOptions: { _id: false, toJSON: { virtuals: true } } })
export class AnimeRelation extends DataVirtual(Anime) {
    @GraphqlType.Field({ nullable: true })
    @MongooseType.Prop({ required: true })
    pubId!: string;
}
