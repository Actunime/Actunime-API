import { Prop } from "@typegoose/typegoose";
import { Field, InputType } from "type-graphql";
import { Anime } from "./_anime.type";
import { MediaDateInput, MediaImageInput, MediaLinkInput, MediaTitleInput } from "../util.input";

const notRequired = { nullable: true };


@InputType()
class AnimeEpisodeInput {
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

// @InputType()
// class AnimeRelation<T> {
//     @Field()
//     @Prop()
//     description!: string;
//     @Field(_ => [Number])
//     @Prop({ type: () => [Number] })
//     episodes!: number[];
//     @Field()
//     @Prop()
//     data!: T;
//     @Field()
//     @Prop()
//     id!: number;
// }


@InputType({ description: "Anime" })
export class AnimeInput implements Partial<Anime> {
    @Field()
    @Prop()
    title?: MediaTitleInput

    @Field(notRequired)
    @Prop()
    date?: MediaDateInput;

    @Field(notRequired)
    @Prop()
    image?: MediaImageInput;

    @Field(notRequired)
    @Prop()
    synopsis?: string;

    @Field(notRequired)
    @Prop()
    source?: string;

    @Field(notRequired)
    @Prop()
    format?: string;

    @Field(_ => [String], notRequired)
    @Prop({ type: () => [String] })
    genres?: string[];

    @Field(_ => [String], notRequired)
    @Prop({ type: () => [String] })
    themes?: string[];

    @Field(notRequired)
    @Prop()
    status?: string;

    @Field(notRequired)
    @Prop()
    episodes?: AnimeEpisodeInput;

    @Field(notRequired)
    @Prop()
    adult?: boolean;

    @Field(notRequired)
    @Prop()
    explicit?: boolean;

    @Field(notRequired)
    @Prop()
    links?: MediaLinkInput;

    // @Field(_ => [AnimeRelation])
    // @Prop({ type: () => [AnimeRelation] })
    // companys?: AnimeRelation[];

    // @Field(_ => [AnimeRelation])
    // @Prop({ type: () => [AnimeRelation] })
    // staffs?: AnimeRelation[];

    // @Field(_ => [AnimeRelation])
    // @Prop({ type: () => [AnimeRelation] })
    // characters?: AnimeRelation[];

    // @Field(_ => [AnimeRelation])
    // @Prop({ type: () => [AnimeRelation] })
    // tracks?: AnimeRelation[]

    async init(props: AnimeInput) {
        this.title = props.title;
        this.date = props.date;
        this.image = props.image;
        this.synopsis = props.synopsis;
        this.source = props.source;
        this.format = props.format;
        this.genres = props.genres;
        this.themes = props.themes;
        this.status = props.status;
        this.episodes = props.episodes;
        this.adult = props.adult;
        this.explicit = props.explicit;
        this.links = props.links;

        return this;
    }

    async toJSON() {
        let data: Anime = {};

        for (const key in this) {
            if (Object.prototype.hasOwnProperty.call(this, key)) {
                const element = this[key];
                if (typeof element !== 'function') {
                    // @ts-ignore
                    data[key] = element;
                }
            }
        }

        return data;
    }
}
