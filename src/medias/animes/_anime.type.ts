// Modules
import { ClassType, Field, InputType, ObjectType, registerEnumType } from "type-graphql";
import { ModelOptions, Prop, ReturnModelType, modelOptions, types } from "@typegoose/typegoose";
import { FilterQuery } from "mongoose";
// Utiles
import { IMedia } from "../../utils/_media.base";
import { MediaTitle, MediaDate, MediaLink, MediaImage, MediaSearchLogic } from "../../utils/_media.types";
import { DefaultAnimeFormatEnum, DefaultSourceEnum, DefaultStatusEnum, GenresEnum } from "../defaultData";
import themes from '../defaultFiles/themes.json';
// Relations
import { PersonRelation } from "../persons/_person.model";
import { TrackRelation } from "../tracks/_track.model";
import { CharacterRelation } from "../characters/_character.model";
import { CompanyRelation } from "../companys/_company.model";
import { GroupeRelation } from "../groupe/_groupe.type";
import { fieldsProjection } from "graphql-fields-list";

@ObjectType()
@modelOptions({ schemaOptions: { _id: false, toJSON: { virtuals: true } } })
export class AnimeRelation {
    @Field({ nullable: true })
    @Prop({ required: true })
    id!: string;

    public get data() {
        return this.id;
    }
}

/** Anime part types */
@ObjectType()
@ModelOptions({ schemaOptions: { _id: false } })
class AnimeEpisode {
    // @Field({ nullable: true }) @Prop()
    @Field({ nullable: true })
    @Prop()
    airing?: number;

    @Field({ nullable: true })
    @Prop()
    nextAiringDate?: Date;

    @Field({ nullable: true })
    @Prop()
    total?: number;

    @Field({ nullable: true })
    @Prop()
    durationMinutePerEp?: number;
}

@ObjectType()
@ModelOptions({ schemaOptions: { _id: false } })
class AnimeSource {
    @Field(() => DefaultSourceEnum)
    @Prop({ enum: DefaultSourceEnum })
    origine!: DefaultSourceEnum
    @Field({ nullable: true })
    @Prop()
    refPubId?: string
}

/** Anime type */
@ObjectType()
export class Anime {

    @Field(_ => GroupeRelation, { nullable: true })
    @Prop({ type: GroupeRelation })
    groupe?: GroupeRelation;

    @Field(_ => AnimeRelation, { nullable: true })
    @Prop({ type: AnimeRelation, default: undefined })
    parent?: AnimeRelation;

    @Field(_ => MediaTitle, { nullable: true })
    @Prop({ default: undefined })
    title?: MediaTitle

    @Field(_ => MediaDate, { nullable: true })
    @Prop({ default: undefined })
    date?: MediaDate;

    @Field(_ => MediaImage, { nullable: true })
    @Prop({ default: undefined })
    image?: MediaImage;

    @Field({ nullable: true })
    @Prop({ default: undefined })
    synopsis?: string;

    @Field(() => AnimeSource, { nullable: true })
    @Prop({ type: AnimeSource, default: undefined })
    source?: AnimeSource;

    @Field(_ => DefaultAnimeFormatEnum, { nullable: true })
    @Prop({ enum: DefaultAnimeFormatEnum, default: undefined })
    format?: DefaultAnimeFormatEnum;

    @Field({ nullable: true })
    @Prop({ default: undefined })
    vf?: boolean

    @Field(_ => [GenresEnum], { nullable: true })
    @Prop({ type: () => [String], default: undefined })
    genres?: GenresEnum[];

    @Field(_ => [String], { nullable: true })
    @Prop({ type: () => [String], default: undefined, validate: (v: string) => themes.find((x) => x.value === v) ? true : false })
    themes?: string[];

    @Field(_ => DefaultStatusEnum, { nullable: true })
    @Prop({ enum: DefaultStatusEnum, default: undefined })
    status?: DefaultStatusEnum;

    @Field(t => AnimeEpisode, { nullable: true })
    @Prop({ type: AnimeEpisode })
    episodes?: AnimeEpisode;

    @Field({ nullable: true })
    @Prop({ default: undefined })
    adult?: boolean;

    @Field({ nullable: true })
    @Prop({ default: undefined })
    explicit?: boolean;

    @Field(t => [MediaLink], { nullable: true })
    @Prop({ type: [MediaLink], default: undefined })
    links?: MediaLink[];

    @Field(_ => [CompanyRelation], { nullable: true })
    @Prop({ type: () => [CompanyRelation], default: undefined })
    companys?: CompanyRelation[];

    @Field(_ => [PersonRelation], { nullable: true })
    @Prop({ type: () => [PersonRelation], default: undefined })
    staffs?: PersonRelation[];

    @Field(_ => [CharacterRelation], { nullable: true })
    @Prop({ type: [CharacterRelation], default: undefined })
    characters?: CharacterRelation[];

    @Field(_ => [TrackRelation], { nullable: true })
    @Prop({ type: () => [TrackRelation], default: undefined })
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


@InputType()
export class AnimeSearchQuery {
    @Field({ nullable: true })
    groupe?: string; // Groupe id

    @Field({ nullable: true })
    parent?: string; // parent Id

    @Field({ nullable: true })
    title?: string // MediaTitle

    @Field(() => Season, { nullable: true })
    season?: Season

    @Field({ nullable: true })
    year?: number

    @Field(() => DefaultSourceEnum, { nullable: true })
    source?: DefaultSourceEnum;

    @Field({ nullable: true })
    format?: string;

    @Field({ nullable: true })
    vf?: boolean

    @Field(_ => [String], { nullable: true })
    genres?: string[];

    @Field(_ => [String], { nullable: true })
    themes?: string[];

    @Field({ nullable: true })
    status?: string;

    @Field({ nullable: true })
    minEpisodes?: number;

    @Field({ nullable: true })
    adult?: boolean;

    @Field({ nullable: true })
    explicit?: boolean;

    @Field({ nullable: true })
    company?: string; // company Id

    @Field({ nullable: true })
    staff?: string; // staff id

    @Field({ nullable: true })
    character?: string; // character id

    @Field({ nullable: true })
    track?: string; // track id


    static async dynamicPopulate(this: types.QueryHelperThis<ClassType<IMedia<Anime>>, AnimeCustomQuery>, info: any) {
        if (!info) return this;
        const projection = Object.fromEntries(Object.keys(fieldsProjection(info)).map(key => [key, 1]));

        const companysRelations = Object.keys(projection).filter(key => key.includes('.companys.'))
        if (companysRelations.length) {
            this?.populate({
                path: 'data.companys.company',
            })
        }

        const staffsRelations = Object.keys(projection).filter(key => key.includes('.staffs.'))
        if (staffsRelations.length) {
            this?.populate({
                path: 'data.staffs.person',
            })
        }

        const charactersRelations = Object.keys(projection).filter(key => key.includes('.characters.') && !key.includes('.actors.'))
        if (charactersRelations.length) {
            const actorsRelations = Object.keys(projection).filter(key => key.includes('.actors.'))
            this?.populate({
                path: 'data.characters.character',
                ...actorsRelations.length && {
                    populate: {
                        path: 'data.actors.person',
                        foreignField: 'id',
                        model: 'Person'
                    }
                }
            })
        }

        const tracksRelations = Object.keys(projection).filter(key => key.includes('.tracks.') && !key.includes('.artists.'))
        if (tracksRelations.length) {
            const artistsRelations = Object.keys(projection).filter(key => key.includes('.artists.'))
            this?.populate({
                path: 'data.tracks.track',
                ...artistsRelations.length && {
                    populate: {
                        path: 'data.artists.person',
                        foreignField: 'id',
                        model: 'Person'
                    }
                }
            })
        }

        return this;
    }

    static parse<TModel extends new (...args: any) => any>(props: AnimeSearchQuery | null, logic?: MediaSearchLogic, model?: TModel) {

        let query: FilterQuery<ReturnModelType<TModel, AnimeCustomQuery>>[] = [];
        if (!props) return {};

        if (props.title)
            query = query.concat([
                { "data.title.default": { "$regex": props.title, "$options": "i" } },
                { "data.title.romaji": { "$regex": props.title, "$options": "i" } },
                { "data.title.native": { "$regex": props.title, "$options": "i" } },
                { "data.title.alias.0": { "$regex": props.title, "$options": "i" } },
            ])

        if (props.groupe)
            query.push({ 'data.groupe': props.groupe })

        if (props.parent)
            query.push({ 'data.parent': props.parent })

        if (props.season) {
            // const date = new Date();
            // const month = date.getMonth();
            function getMonths() {
                let months: number[] = [];
                if (!props) return months;
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

            query.push({
                $or: mQuery
            })
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
            query.push({ 'data.companys.id': props.company })

        if (props.staff)
            query.push({ 'data.staffs.id': props.staff })

        if (props.character)
            query.push({ 'data.characters.id': props.character })

        if (props.track)
            query.push({ 'data.tracks.id': props.track })

        switch (logic) {
            case MediaSearchLogic.OR:
                query = [{ $or: query }]
                return query[0];

            case MediaSearchLogic.AND:
                query = [{ $and: query }]
                return query[0]

            default:
                query = [{ $or: query }]
                return query[0];
        }
    }
    static queryParse(this: types.QueryHelperThis<ClassType<Anime>, AnimeCustomQuery>, props: AnimeSearchQuery, logic: MediaSearchLogic) {

        const query = AnimeSearchQuery.parse(props, logic);

        this.setQuery(query as any);

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

export interface AnimeCustomQuery {
    queryParse: types.AsQueryMethod<typeof AnimeSearchQuery.queryParse>;
    dynamicPopulate: types.AsQueryMethod<typeof AnimeSearchQuery.dynamicPopulate>;
}
