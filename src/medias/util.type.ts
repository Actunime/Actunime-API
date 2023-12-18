import { Index, Pre, Prop } from "@typegoose/typegoose";
import { ClassType, Field, InputType, ObjectType, registerEnumType } from "type-graphql";
import { genPublicID } from "../helpers.db";
import { genMediaFromUpdate } from "./util.query";
import { Document, Types } from 'mongoose';
import { BeAnObject, IObjectWithTypegooseFunction } from "@typegoose/typegoose/lib/types";


const notRequired = { nullable: true };

/** Media construction */
@Index({ pubId: 'text' }, { unique: true })
@ObjectType()
export class MediaFormat<TMedia, UpdateSchema, UpdateRequest> {
    _id!: Types.ObjectId;

    @Prop({ required: true, default: () => genPublicID() })
    @Field()
    pubId?: string;

    @Prop({ default: null })
    data!: TMedia;

    @Prop({ default: [] })
    updates!: UpdateSchema[];
    @Prop({ default: [] })
    updatesRequests!: UpdateRequest[];
    @Prop({ default: false })
    @Field()
    public!: boolean;
    @Prop({ default: false })
    @Field()
    locked?: boolean;
    @Prop({ default: null })
    @Field()
    lockedBy?: number;
}

@ObjectType()
export class MediaUpdateFormat<T> {
    @Prop({ index: true, required: true })
    @Field()
    versionId!: number;
    @Prop()
    data!: T;
    @Prop()
    @Field()
    createdAt!: Date;
    @Prop()
    @Field()
    author!: number;
    @Prop()
    @Field()
    moderator!: number;
    @Prop()
    @Field()
    public!: boolean;
    @Prop()
    @Field()
    deletedReason?: string;
    @Prop()
    @Field()
    deletedAt?: Date;
}

@ObjectType()
export class MediaUpdateRequestFormat<T> {
    @Prop({ index: true, required: true })
    @Field()
    versionId!: number;
    @Prop()
    data!: T;
    @Prop()
    @Field()
    createdAt!: Date;
    @Prop()
    @Field()
    author!: number;
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



/** Media part types */
@ObjectType()
export class MediaTitle {
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


@ObjectType()
export class MediaDate {
    @Field()
    @Prop()
    start!: string;
    @Field()
    @Prop()
    end!: string;
}

@ObjectType()
export class MediaImage {
    @Field()
    @Prop()
    poster!: string;
    @Field()
    @Prop()
    banner!: string;
}

@ObjectType()
export class MediaLink {
    @Field()
    @Prop()
    name!: string;
    @Field()
    @Prop()
    value!: string;
}


/** Graphql */

@InputType({ description: "Pagination options" })
export class Pagination {
    @Field({ nullable: true, description: "Page a retourné" })
    page!: number;
    @Field({ nullable: true, description: "Limite résultats" })
    limit!: number;
}

export function PaginationOutput<TData extends object>(DataClass: ClassType<TData>) {
    @ObjectType({ description: "Pagination responses" })
    abstract class PaginationOutput {
        @Field()
        currentPage!: number;
        @Field()
        totalPage!: number;
        @Field()
        limitPerPage!: number;
        @Field()
        totalResults!: number;
        @Field()
        hasNextPage!: boolean;
        @Field()
        hasPrevPage!: boolean;
        @Field(_ => [DataClass], { nullable: true, defaultValue: [] })
        results!: TData[];
    }
    return PaginationOutput;
}


@InputType({ description: "Query recherche" })
export class SearchQuery {
    // @Field({ nullable: true })
    // id!: string;
}


export function MediaFormatOutput<TMedia extends object, TUpdate, TUpdateRequest>(MediaClass: ClassType<TMedia>) {
    @ObjectType({ description: "Format Anime dans la base de données" })
    abstract class MediaFormatOutput extends MediaFormat<TMedia, TUpdate, TUpdateRequest>
    {
        @Field({ description: "Date de la derniere modification validé" })
        lastUpdateDate?: Date;
        @Field({ description: "Date de la derniere requête de modification" })
        lastRequestDate?: Date;
    }
    return MediaFormatOutput;
}

export enum MediaType {
    ANIME = "ANIME",
    MANGA = "MANGA",
    CHARACTER = "CHARACTER",
    COMPANY = "COMPANY",
    STAFF = "STAFF",
    TRACK = "TRACK",
    PERSON = "PERSON"
}

registerEnumType(MediaType, {
    name: "MediaType",
    description: "Type de média"
})

@ObjectType()
export class MediaUpdateOutput {
    @Field(_ => MediaType, { description: "media type" })
    mediaType!: MediaType
    @Field({ description: "Message informatif", nullable: true })
    message!: string;
    @Field({ description: "Message d'erreur si y a une erreur", nullable: true })
    error?: string;
    @Field({ description: "Id du média si il a été bien crée.", nullable: true })
    id?: string;
}

// @ObjectType()
// export class MediaMultipleUpdateOutput {
//     @Field({ description: "Message informatif" })
//     message!: string;
//     @Field({ description: "Message d'erreur si y a une erreur" })
//     error!: string;
//     @Field(_ => [MediaUpdateOutput], { description: "Id du média si il a été bien crée." })
//     medias!: MediaUpdateOutput[];
// }

export type MediaDoc<T = any> = Document<unknown, BeAnObject, T> & Omit<T & { _id: Types.ObjectId; }, "typegooseName"> & IObjectWithTypegooseFunction

export type ObjectId = Types.ObjectId;