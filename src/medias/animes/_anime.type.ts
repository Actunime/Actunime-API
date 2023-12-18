import * as MongooseType from "@typegoose/typegoose";
import * as GraphqlType from "type-graphql";
import * as Medias from "../";
import { Types } from 'mongoose';
import { AnimeSourceType } from "./_anime.input";
/** Anime part types */

@GraphqlType.ObjectType()
class AnimeEpisode {
    @GraphqlType.Field({ nullable: true })
    @MongooseType.Prop()
    airing?: number;
    @GraphqlType.Field({ nullable: true })
    @MongooseType.Prop()
    nextAiringDate!: Date;
    @GraphqlType.Field({ nullable: true })
    @MongooseType.Prop()
    total?: number;
    @GraphqlType.Field({ nullable: true })
    @MongooseType.Prop()
    durationMinutePerEp!: number;
}

@GraphqlType.ObjectType()
class AnimeSource {
    @GraphqlType.Field(() => AnimeSourceType)
    @MongooseType.Prop({ type: AnimeSourceType })
    origine!: AnimeSourceType
    @GraphqlType.Field({ nullable: true })
    @MongooseType.Prop()
    refPubId!: string
}

/** Anime type */
@GraphqlType.ObjectType({ description: "Anime" })
export class Anime {
    // _id?: Types.ObjectId

    @GraphqlType.Field()
    @MongooseType.Prop()
    id?: string;

    @GraphqlType.Field()
    @MongooseType.Prop({ required: true })
    title!: Medias.MediaTitle

    @GraphqlType.Field()
    @MongooseType.Prop()
    date?: Medias.MediaDate;

    @GraphqlType.Field()
    @MongooseType.Prop()
    image?: Medias.MediaImage;

    @GraphqlType.Field()
    @MongooseType.Prop()
    synopsis?: string;

    @GraphqlType.Field(() => AnimeSource)
    @MongooseType.Prop({ type: AnimeSource })
    source?: AnimeSource;

    @GraphqlType.Field()
    @MongooseType.Prop()
    format?: string;

    @GraphqlType.Field({ nullable: true })
    @MongooseType.Prop({ default: false })
    vf?: boolean

    @GraphqlType.Field(_ => [String])
    @MongooseType.Prop({ type: () => [String] })
    genres?: string[];

    @GraphqlType.Field(_ => [String])
    @MongooseType.Prop({ type: () => [String] })
    themes?: string[];

    @GraphqlType.Field()
    @MongooseType.Prop()
    status?: string;

    @GraphqlType.Field()
    @MongooseType.Prop()
    episodes?: AnimeEpisode;

    @GraphqlType.Field()
    @MongooseType.Prop()
    adult?: boolean;

    @GraphqlType.Field()
    @MongooseType.Prop()
    explicit?: boolean;

    @GraphqlType.Field()
    @MongooseType.Prop()
    links?: Medias.MediaLink;

    @GraphqlType.Field(_ => [Medias.CompanyRelation])
    @MongooseType.Prop({ type: () => [Medias.CompanyRelation] })
    companys?: Medias.CompanyRelation[];

    // @GraphqlType.Field(_ => [AnimeRelation])
    // @MongooseType.Prop({ type: () => [AnimeRelation] })
    // staffs?: AnimeRelation[];

    // @GraphqlType.Field(_ => [AnimeRelation])
    // @MongooseType.Prop({ type: () => [AnimeRelation] })
    // characters?: AnimeRelation[];

    // @GraphqlType.Field(_ => [AnimeRelation])
    // @MongooseType.Prop({ type: () => [AnimeRelation] })
    // tracks?: AnimeRelation[]

    constructor(props: Anime) {
        Object.assign(this, props);
    }
}


@GraphqlType.ObjectType({ description: "Format AnimeUpdate dans la base de données" })
export class AnimeUpdate extends Medias.MediaUpdateFormat<Anime> {
    @MongooseType.Prop({ type: () => Anime })
    @GraphqlType.Field(_ => Anime)
    declare data: Anime;
}

@GraphqlType.ObjectType({ description: "Format AnimeRequest dans la base de données" })
export class AnimeRequest extends Medias.MediaUpdateRequestFormat<Anime> {
    @MongooseType.Prop({ type: () => Anime })
    @GraphqlType.Field(_ => Anime)
    declare data: Anime;
}



@MongooseType.Pre<AnimeMedia>('save', function (next) {
    this.data = Medias.genMediaFromUpdate(this.updates);
    next()
})
@MongooseType.QueryMethod(Medias.searchMediaByTitle<typeof AnimeMedia>)
@GraphqlType.ObjectType({ description: "Format Anime dans la base de données" })
export class AnimeMedia extends Medias.MediaFormat<Anime, AnimeUpdate, AnimeRequest> {
    @MongooseType.Prop({ default: [] })
    @GraphqlType.Field(_ => [AnimeUpdate])
    declare updates: AnimeUpdate[];
    @MongooseType.Prop({ default: [] })
    @GraphqlType.Field(_ => [AnimeRequest])
    declare updatesRequests: AnimeRequest[];
}

@GraphqlType.ObjectType()
export class AnimeMediaOutput extends Medias.MediaFormatOutput<Anime, AnimeUpdate, AnimeRequest>(Anime) {
    @GraphqlType.Field(() => Anime)
    declare data: Anime;
    @MongooseType.Prop({ default: [] })
    @GraphqlType.Field(_ => [AnimeUpdate])
    declare updates: AnimeUpdate[];
    @MongooseType.Prop({ default: [] })
    @GraphqlType.Field(_ => [AnimeRequest])
    declare updatesRequests: AnimeRequest[];
}

@GraphqlType.ObjectType()
export class AnimeMediaPaginationOutput extends Medias.PaginationOutput<AnimeMediaOutput>(AnimeMediaOutput) { }

@GraphqlType.ObjectType()
export class AnimePaginationOutput extends Medias.PaginationOutput<Anime>(Anime) { }

@GraphqlType.InputType()
export class AnimeSearchQuery extends Medias.SearchQuery {
    @GraphqlType.Field()
    title!: string;
}

interface AnimeMediaQueryHelpers {
    searchMediaByTitle: MongooseType.types.AsQueryMethod<typeof Medias.searchMediaByTitle<typeof AnimeMedia>>;
}

export const AnimeModel = MongooseType.getModelForClass<typeof AnimeMedia, AnimeMediaQueryHelpers>(AnimeMedia, { schemaOptions: { toJSON: { virtuals: true } } });