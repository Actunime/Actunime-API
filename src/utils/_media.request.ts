import { Prop } from "@typegoose/typegoose";
import { ClassType, Field, ObjectType } from "type-graphql";
import { genPublicID } from "./_genPublicId";

export interface IMediaRequests<TMedia> {
    versionId: string;
    data: TMedia;
    createdAt: Date;
    updatedAt: Date;
    author?: string;
    status: string;
    rejectedReason?: string;
    acceptNewUpdateFromAuthor?: boolean;
    deletedReason?: string;
    deletedAt?: Date;
}

export function MediaRequestFormat<TMedia extends object>(Media: ClassType<TMedia>) {
    @ObjectType()
    abstract class MediaRequestFormat implements IMediaRequests<TMedia> {
        @Prop({ index: true, required: true, default: () => genPublicID() })
        @Field()
        versionId!: string;
        @Prop({ type: Media })
        @Field(_ => Media)
        data!: TMedia;
        @Prop()
        @Field()
        createdAt!: Date;
        @Prop()
        @Field()
        updatedAt!: Date;
        @Prop()
        @Field()
        author!: string;
        @Prop()
        @Field()
        status!: string;
        @Prop()
        @Field()
        rejectedReason?: string;
        @Prop()
        @Field()
        acceptNewUpdateFromAuthor?: boolean;
        @Prop()
        @Field()
        deletedAt?: Date;
    }
    return MediaRequestFormat;
}