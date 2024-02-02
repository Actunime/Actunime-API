import { Prop, modelOptions } from "@typegoose/typegoose";
import { Field, InputType, ObjectType, registerEnumType } from "type-graphql";

/** Media part types */
@ObjectType()
export class MediaTitle {
    @Field({ nullable: true })
    @Prop()
    default?: string;

    @Field({ nullable: true })
    @Prop()
    romaji!: string;

    @Field({ nullable: true })
    @Prop()
    native!: string;

    @Field(_ => [String], { nullable: true })
    @Prop({ type: () => [String] })
    alias?: string[];
}


@ObjectType()
@modelOptions({ schemaOptions: { toJSON: { getters: true, virtuals: true } } })
export class MediaDate {
    @Field()
    @Prop({ transform: (v) => new Date(v) })
    start!: Date;

    @Field()
    @Prop({ transform: (v) => new Date(v) })
    end!: Date;
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

export enum MediaPersonGender {
    HOMME = "HOMME",
    FEMME = "FEMME",
    NON_BINAIRE = "NON BINAIRE"
}

registerEnumType(MediaPersonGender, {
    name: "MediaPersonGender",
    description: "Genre des personnes ou des personnages"
})

@ObjectType()
export class MediaPersonOrCharacterName {
    @Field()
    @Prop()
    first?: string;

    @Field()
    @Prop()
    end?: string;

    @Field(type => [String])
    @Prop({ type: [String] })
    alias?: string[];
}

/** INPUT */

@InputType()
export class MediaTitleInput {
    @Field()
    @Prop()
    default?: string;
    @Field()
    @Prop()
    romaji!: string;
    @Field()
    @Prop()
    native!: string;
    @Field(_ => [String], { nullable: true })
    @Prop({ type: () => [String] })
    alias?: string[];
}


@InputType()
export class MediaDateInput {
    @Field()
    @Prop({ transform: (v) => new Date(v) })
    start!: Date;

    @Field()
    @Prop({ transform: (v) => new Date(v) })
    end!: Date;
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

@InputType()
export class MediaPersonOrCharacterNameInput {
    @Field()
    @Prop()
    first?: string;

    @Field()
    @Prop()
    end?: string;

    @Field(type => [String])
    @Prop({ type: [String] })
    alias?: string[];
}

export enum MediaSearchLogic {
    OR = "OR",
    AND = "AND"
}

registerEnumType(MediaSearchLogic, {
    name: "MediaSearchLogic",
    description: "Logic de recherche, les valeurs doivent être précis sur les résultats ou non précis ou la recherche est divercifié si l'un des contenue correspond a une recherche"
})
