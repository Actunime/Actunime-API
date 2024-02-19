import { Field, ObjectType, Query, Resolver, registerEnumType } from "type-graphql";
//
import genres from './defaultFiles/genres.json';
import formats from './defaultFiles/formats.json';
import sources from './defaultFiles/sources.json';
import status from './defaultFiles/status.json';
import themes from './defaultFiles/themes.json';
import personRoles from './defaultFiles/personRoles.json';
import trackTypes from './defaultFiles/trackTypes.json';

@ObjectType()
class ListLabelValue {
    @Field()
    label!: string;
    @Field()
    value!: string;
    @Field({ nullable: true })
    description?: string;
}

@ObjectType()
class DefaultData {
    @Field(t => [ListLabelValue])
    sources!: ListLabelValue[]

    @Field(t => [ListLabelValue])
    status!: ListLabelValue[]

    @Field(t => [ListLabelValue])
    formats!: ListLabelValue[]

    @Field(t => [ListLabelValue])
    genres!: ListLabelValue[]

    @Field(t => [ListLabelValue])
    themes!: ListLabelValue[]

    @Field(t => [ListLabelValue])
    personRoles!: ListLabelValue[]

    @Field(t => [ListLabelValue])
    trackTypes!: ListLabelValue[]
}


@Resolver(DefaultData)
export class DefaultDataResolver {

    @Query(type => DefaultData, { nullable: true })
    async defaultData(): Promise<DefaultData | null> {
        console.log('Récupération defaultdata')
        return {
            sources,
            status,
            formats,
            genres,
            themes,
            personRoles,
            trackTypes
        }
    }
}



export enum GenresEnum {
    ACTION = 'ACTION',
    AVENTURE = 'AVENTURE',
    COMEDIE = 'COMEDIE',
    DRAME = 'DRAME',
    FANTAISIE = 'FANTAISIE',
    HORREUR = 'HORREUR',
    ROMANCE = 'ROMANCE',
    SCI_FI = 'SCI_FI',
    TRANCHE_DE_VIE = 'TRANCHE_DE_VIE',
    SPORTS = 'SPORTS',
    MECHA = 'MECHA',
    MYSTERE = 'MYSTERE',
    PSYCHOLOGIQUE = 'PSYCHOLOGIQUE',
    POLAR = 'POLAR',
    ISEKAI = 'ISEKAI',
    HAREM = 'HAREM',
    REVERSE_HAREM = 'REVERSE_HAREM',
    ECCHI = 'ECCHI',
    MAGICAL_GIRL = 'MAGICAL_GIRL',
    SLICE_OF_LIFE = 'SLICE_OF_LIFE',
    CYBERPUNK = 'CYBERPUNK',
    POST_APOCALYPTIQUE = 'POST_APOCALYPTIQUE',
    MARTIAL_ARTS = 'MARTIAL_ARTS',
    SUPER_POWER = 'SUPER_POWER',
    VAMPIRE = 'VAMPIRE',
    YAOI = 'YAOI',
    YURI = 'YURI',
    SHOUNEN = 'SHOUNEN',
    SEINEN = 'SEINEN',
    SHOJO = 'SHOJO',
    JOSEI = 'JOSEI',
    KODOMOMUKE = 'KODOMOMUKE'
}

registerEnumType(GenresEnum, {
    name: "GenresEnum",
    description: "Les différents genres"
})

export enum DefaultAnimeFormatEnum {
    SERIE = "SERIE",
    FILM = "FILM",
    ONA = "ONA",
    OVA = "OVA",
    SPECIAL = "SPECIAL",
    TV_SHORT = "TV_SHORT"
}

export enum DefaultMangaFormatEnum {
    MANGA = "MANGA",
    MANHWA = "MANHWA",
    MANHUA = "MANHUA",
}

registerEnumType(DefaultAnimeFormatEnum, {
    name: "DefaultAnimeFormatEnum",
    description: "Format de diffusion pour les animes"
})


export enum DefaultSourceEnum {
    ORIGINAL = "ORIGINAL",
    MANGA = "MANGA",
    MANHWA = "MANHWA",
    MANHUA = "MANHUA",
    LIGHT_NOVEL = "LIGHT_NOVEL",
    VISUAL_NOVEL = "VISUAL_NOVEL",
    WEB_NOVEL = "WEB_NOVEL",
    GAME = "GAME",
    NOVEL = "NOVEL",
    ANIME = "ANIME"
}

registerEnumType(DefaultSourceEnum, {
    name: "DefaultSourceEnum",
    description: "Sources d'adaptation"
})

export enum DefaultStatusEnum {
    AIRING = "AIRING",
    PAUSED = "PAUSED",
    ENDED = "ENDED",
    STOPPED = "STOPPED",
    POSTONED = "POSTONED",
    COMMING_SOON = "COMMING_SOON",
    UNKNOWN = "UNKNOWN"
}

registerEnumType(DefaultStatusEnum, {
    name: "DefaultStatusEnum",
    description: "Statuts de diffusion"
})