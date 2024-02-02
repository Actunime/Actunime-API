import { Index, ModelOptions, Prop } from "@typegoose/typegoose";
import { ClassType, Field, ObjectType } from "type-graphql";
import { Types } from 'mongoose';
import { IMediaUpdates, MediaUpdateFormat } from "./_media.update";
import { IMediaRequests, MediaRequestFormat } from "./_media.request";
import { genPublicID } from "./_genPublicId";


interface IMediaFormat<TMedia, TUpdate = IMediaUpdates<TMedia>, TRequest = IMediaRequests<TMedia>> {
    _id: Types.ObjectId;
    pubId: string;
    data: TMedia | null;
    updates: TUpdate[];
    requests: TRequest[];
    visible: boolean;
    locked: boolean;
    lockedBy: number;
}


function MediaFormat<TMedia extends object>(Media: ClassType<TMedia>) {
    if (!Media) throw "Media non défini"
    console.log('mediaFormat', Media?.name)
    // const updates = MediaUpdateFormat<TMedia>(Media);
    // const requests = MediaRequestFormat<TMedia>(Media);
    // /** Media construction */

    @ObjectType()
    abstract class Update extends MediaUpdateFormat(Media) { };

    @ObjectType()
    abstract class Request extends MediaRequestFormat(Media) { };

    @Index({ pubId: 'text' }, { unique: true })
    @ObjectType()
    @ModelOptions({ schemaOptions: { timestamps: true } })
    abstract class MediaFormat {
        _id!: Types.ObjectId;

        @Prop({ required: true, default: () => genPublicID() })
        @Field({ nullable: true })
        pubId!: string;

        @Prop({ type: Media, default: null })
        @Field(_ => Media, { nullable: true })
        data!: TMedia | null;

        @Prop({ type: [Update], default: [] })
        @Field(_ => [Update], { nullable: true })
        updates!: IMediaUpdates<TMedia>[];

        @Prop({ type: [Request], default: [] })
        @Field(_ => [Request], { nullable: true })
        requests!: IMediaRequests<TMedia>[];

        @Prop({ default: false })
        @Field({ nullable: true })
        visible!: boolean;

        @Prop({ default: false })
        @Field({ nullable: true })
        locked?: boolean;

        @Prop({ default: null })
        @Field({ nullable: true })
        lockedBy?: number;
    }

    return MediaFormat;
}

function MediaFormatOutput<TMedia extends object>(
    Media: ClassType<TMedia>) {
    @ObjectType({ description: "Format Anime dans la base de données" })
    abstract class MediaFormatOutput extends MediaFormat<TMedia>(Media)
    {
        @Field(_ => Date, { description: "Date de la derniere modification validé", nullable: true })
        lastUpdateDate?: Date | null;
        @Field(_ => Date, { description: "Date de la derniere requête de modification", nullable: true })
        lastRequestDate?: Date | null;
    }
    return MediaFormatOutput;
}

export type { IMediaFormat }
export { MediaFormat, MediaFormatOutput }