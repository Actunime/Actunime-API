import { Prop } from "@typegoose/typegoose";
import { ClassType, Field, InputType, ObjectType } from "type-graphql";
import { MediaType } from "./_media.types";
import { genPublicID } from "./_genPublicId";


export interface IMediaUpdates<TMedia> {
    versionId?: string;
    data: TMedia;
    createdAt?: Date;
    updatedAt?: Date;
    author?: string;
    moderator?: string;
    visible?: boolean;
    deletedReason?: string;
    deletedAt?: Date;
}

export function MediaUpdateFormat<TMedia extends object>(Media: ClassType<TMedia>) {
    @ObjectType()
    abstract class MediaUpdateFormat implements IMediaUpdates<TMedia> {
        @Prop({ index: true, required: true, default: () => genPublicID() })
        @Field({ nullable: true })
        versionId!: string;

        @Prop({ type: Media, _id: false })
        @Field(_ => Media, { nullable: true })
        data!: TMedia;

        @Prop({ default: () => Date.now() })
        @Field({ nullable: true })
        createdAt!: Date;

        @Prop({ default: Date.now(), })
        @Field({ nullable: true })
        updatedAt!: Date;

        @Prop()
        @Field({ nullable: true })
        author!: string;

        @Prop()
        @Field({ nullable: true })
        moderator!: string;

        @Prop({ default: true })
        @Field({ nullable: true })
        visible!: boolean;

        @Prop()
        @Field({ nullable: true })
        deletedReason?: string;

        @Prop()
        @Field({ nullable: true })
        deletedAt?: Date;
    }
    return MediaUpdateFormat;
}

@InputType()
export class MediaUpdateOptionArg {
    @Field(type => Boolean, { nullable: true })
    visible!: boolean;
}


@ObjectType()
export class MediaUpdateOutput {
    @Field(_ => MediaType, { description: "media type" })
    mediaType!: MediaType
    @Field({ description: "Message informatif", nullable: true })
    message!: string;
    @Field({ description: "Message d'erreur si y a une erreur", nullable: true })
    error?: string;
    @Field({ description: "Id du média si il a été bien crée.", nullable: true })
    pubId?: string;
}