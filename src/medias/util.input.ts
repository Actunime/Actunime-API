import { Prop } from "@typegoose/typegoose";
import { Field, InputType } from "type-graphql";

const notRequired = { nullable: true };

/** Media part types */

@InputType()
export class MediaTitleInput {
    @Field()
    @Prop()
    default!: string;
    @Field()
    @Prop()
    romaji!: string;
    @Field()
    @Prop()
    native!: string;
    @Field(_ => [String], notRequired)
    @Prop({ type: () => [String] })
    alias!: string[];
}


@InputType()
export class MediaDateInput {
    @Field()
    @Prop()
    start!: string;
    @Field()
    @Prop()
    end!: string;
}

@InputType()
export class MediaImageInput {
    @Field()
    @Prop()
    poster!: string;
    @Field()
    @Prop()
    banner!: string;
}

@InputType()
export class MediaLinkInput {
    @Field()
    @Prop()
    name!: string;
    @Field()
    @Prop()
    value!: string;
}