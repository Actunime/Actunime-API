import { Index, Pre, Prop, QueryMethod, getModelForClass, modelOptions, post, pre, types } from "@typegoose/typegoose";
import { Arg, Field, InputType, ObjectType, Query, Resolver } from "type-graphql";
import { MediaDate, MediaImage, MediaFormat, MediaTitle, MediaUpdateFormat, MediaUpdateRequestFormat, MediaLink, MediaFormatOutput, PaginationOutput, SearchQuery } from "../util.type";
import { Types } from 'mongoose';
import { genMediaFromUpdate, searchMediaByTitle } from "../ulti.query";
let notRequired = { nullable: true }
/** Anime part types */

@ObjectType()
class AnimeEpisode {
    @Field()
    @Prop()
    airing!: string;
    @Field()
    @Prop()
    nextAiringDate!: string;
    @Field()
    @Prop()
    total!: string;
}

@ObjectType()
class AnimeRelation<T = any> {
    @Field()
    @Prop()
    description!: string;
    @Field(_ => [Number])
    @Prop({ type: () => [Number] })
    episodes!: number[];
    // @Field()
    // @Prop()
    // data!: T;
    @Field()
    @Prop()
    id!: number;
}


/** Anime type */
@ObjectType({ description: "Anime" })
export class Anime {
    _id?: Types.ObjectId

    @Field()
    @Prop()
    id?: string;

    @Field(notRequired)
    @Prop()
    title?: MediaTitle

    @Field(notRequired)
    @Prop()
    date?: MediaDate;

    @Field()
    @Prop()
    image?: MediaImage;

    @Field()
    @Prop()
    synopsis?: string;

    @Field()
    @Prop()
    source?: string;

    @Field()
    @Prop()
    format?: string;

    @Field(_ => [String])
    @Prop({ type: () => [String] })
    genres?: string[];

    @Field(_ => [String])
    @Prop({ type: () => [String] })
    themes?: string[];

    @Field()
    @Prop()
    status?: string;

    @Field()
    @Prop()
    episodes?: AnimeEpisode;

    @Field()
    @Prop()
    adult?: boolean;

    @Field()
    @Prop()
    explicit?: boolean;

    @Field()
    @Prop()
    links?: MediaLink;

    @Field(_ => [AnimeRelation])
    @Prop({ type: () => [AnimeRelation] })
    companys?: AnimeRelation[];

    @Field(_ => [AnimeRelation])
    @Prop({ type: () => [AnimeRelation] })
    staffs?: AnimeRelation[];

    @Field(_ => [AnimeRelation])
    @Prop({ type: () => [AnimeRelation] })
    characters?: AnimeRelation[];

    @Field(_ => [AnimeRelation])
    @Prop({ type: () => [AnimeRelation] })
    tracks?: AnimeRelation[]
}


@ObjectType({ description: "Format AnimeUpdate dans la base de données" })
export class AnimeUpdate extends MediaUpdateFormat<Anime> {
    @Prop({ type: () => Anime })
    @Field(_ => Anime)
    declare data: Anime;
}

@ObjectType({ description: "Format AnimeRequest dans la base de données" })
export class AnimeRequest extends MediaUpdateRequestFormat<Anime> {
    @Prop({ type: () => Anime })
    @Field(_ => Anime)
    declare data: Anime;
}


// @Index({ id: 'text' }, { unique: true })
@Pre<AnimeMedia>('save', function (next) {
    this.data = genMediaFromUpdate(this.updates);
    next()
})
@QueryMethod(searchMediaByTitle<typeof AnimeMedia>)
@ObjectType({ description: "Format Anime dans la base de données" })
export class AnimeMedia extends MediaFormat<Anime, AnimeUpdate, AnimeRequest> {
    @Prop({ default: [] })
    @Field(_ => [AnimeUpdate])
    declare updates: AnimeUpdate[];
    @Prop({ default: [] })
    @Field(_ => [AnimeRequest])
    declare updatesRequests: AnimeRequest[];

    // public get data(): Anime | null {
    //     console.log('virtual get', this.updates)
    //     let res = genMediaFromUpdate(this.updates);
    //     return { id: this.id, ...res } || null
    // }

    // public set data(data) {
    //     console.log('virtual set')
    //     this.data = data;
    // }
}


@ObjectType()
export class AnimeMediaOutput extends MediaFormatOutput<Anime, AnimeUpdate, AnimeRequest>(Anime) { }

@ObjectType()
export class AnimeMediaPaginationOutput extends PaginationOutput<AnimeMediaOutput>(AnimeMediaOutput) { }

@ObjectType()
export class AnimePaginationOutput extends PaginationOutput<Anime>(Anime) { }

@InputType()
export class AnimeSearchQuery extends SearchQuery {
    @Field()
    title!: string;
}

interface AnimeMediaQueryHelpers {
    searchMediaByTitle: types.AsQueryMethod<typeof searchMediaByTitle<typeof AnimeMedia>>;
}

export const AnimeModel = getModelForClass<typeof AnimeMedia, AnimeMediaQueryHelpers>(AnimeMedia, { schemaOptions: { toJSON: { virtuals: true } } });