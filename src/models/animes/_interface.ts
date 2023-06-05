import { Document } from "mongoose"
import { MediaTitle, MediaDate, MediaStatus, MediaLink, MediaTag, MediaSource } from "../../types/utils"
import { ICharacterGql, ICharacterPopulated } from "../characters";
import { ICompanyGql, ICompanyPopulated } from "../companys/_interface";
import { IMangaGql, IMangaPopulated } from "../mangas";
import { IPersonGql, IPersonSchema } from "../persons";
import { ITrackGql, ITrackSchema } from "../tracks/_interface";
import { IUpdatePopulated } from "../updates/_interface";
import { GlobalInterface } from "..";

export interface IAnime extends Document {
    _id?: number;
    /** Les différents titres de l'anime */
    title?: MediaTitle
    /** Date de sortie et de fin de l'anime */
    date?: MediaDate
    /** Image bannière et poster de l'anime */
    image?: MediaImage
    /** Synopsis de l'anime */
    description?: string
    /** Source de l'anime */
    source?: MediaSource
    /** Format de l'anime */
    format?: AnimeFormat
    /** Tags de l'anime */
    tags?: MediaTag[]
    /** Status de l'anime */
    status?: MediaStatus
    /** Épisodes de l'anime */
    episodes?: AnimeEpisode
    /** Contenue explicite */
    explicitContent?: boolean
    /** Liens officiels */
    links?: MediaLink[]
    /** Liste studios */
    studios?: (number | ICompanyPopulated)[];
    /** Liste producteurs */
    producers?: (number | ICompanyPopulated)[];
    /** Liste relations animes */
    relationsAnime?: { label: string, data: number | IAnimePopulated | IPersonGql }[],
    /** Liste relations mangas */
    relationsManga?: { label: string, data: number | IMangaPopulated | IPersonGql }[],
    /** Liste staffs */
    staffs?: (number | IPersonSchema)[];
    /** Liste personnages */
    characters?: (number | ICharacterPopulated)[]
    /** Liste musiques */
    tracks?: (number | ITrackSchema)[];
    /** Date d'ajout dans la BD */
    createdAt?: Date;
    /** Date de dernière modification dans la BD */
    editedAt?: Date;
    /** Vérifié par le staff */
    verified: boolean

    /** @virtual - Liste des modifications */
    updates: IUpdatePopulated[]
};

export interface IAnimeSchema extends IAnime {
    _id?: number;
    title: MediaTitle
    date?: MediaDate
    image?: MediaImage
    description?: string
    source?: MediaSource
    format?: AnimeFormat
    tags?: MediaTag[]
    status?: MediaStatus
    episodes?: AnimeEpisode
    explicitContent?: boolean
    links?: MediaLink[]
    studios?: number[];
    producers?: number[];
    relationsAnime?: { label: string, data: number }[],
    relationsManga?: { label: string, data: number }[],
    staffs?: number[];
    characters?: number[]
    tracks?: number[];
    createdAt?: Date;
    editedAt?: Date;
    verified: boolean

    toJSON: () => IAnime;
};

export interface IAnimeOnSaving {
    _id?: number;
    title?: MediaTitle
    date?: MediaDate
    image?: MediaImage
    description?: string
    source?: MediaSource
    format?: AnimeFormat
    tags?: MediaTag[]
    status?: MediaStatus
    episodes?: AnimeEpisode
    explicitContent?: boolean
    links?: MediaLink[]
    studios?: number[];
    producers?: number[];
    relationsAnime?: { label: GlobalInterface.RelationMediaLabel, data: number }[],
    relationsManga?: { label: GlobalInterface.RelationMediaLabel, data: number }[],
    staffs?: GlobalInterface.SpecialRelInputRaw<number>[];
    characters?: GlobalInterface.SpecialRelInputRaw<number>[]
    tracks?: GlobalInterface.SpecialRelInputRaw<number>[];
    createdAt?: Date;
    editedAt?: Date;
    verified?: boolean

    toJSON?: () => IAnime;
};


export interface IAnimePopulated extends IAnime {
    _id?: number;
    title: MediaTitle
    date?: MediaDate
    image?: MediaImage
    description?: string
    source?: MediaSource
    format?: AnimeFormat
    tags?: MediaTag[]
    status?: MediaStatus
    episodes?: AnimeEpisode
    explicitContent?: boolean
    links?: MediaLink[]
    studios?: ICompanyPopulated[];
    producers?: ICompanyPopulated[];
    relationsAnime?: { label: string, data: IAnimePopulated }[],
    relationsManga?: { label: string, data: IMangaPopulated }[],
    staffs?: IPersonSchema[];
    characters?: ICharacterPopulated[]
    tracks?: ITrackSchema[];
    createdAt?: Date;
    editedAt?: Date;
    verified: boolean

    updates: IUpdatePopulated[]
};


export interface IAnimeGqlRaw {
    _id: number,
    title?: {
        romaji?: string
        english?: string
        french?: string
        native?: string
        alias?: (() => string[]) | string[]
    };
    date?: MediaDate;
    image?: MediaImage;
    description?: string;
    source?: MediaSource;
    format?: AnimeFormat;
    tags?: (() => MediaTag[]) | MediaTag[];
    status?: MediaStatus;
    episodes?: AnimeEpisode;
    explicitContent?: boolean;
    links?: (() => MediaLink[]) | MediaLink[];
    studios?: (() => ICompanyGql[]) | ICompanyGql[];
    producers?: (() => ICompanyGql[]) | ICompanyGql[];
    relationsAnime?: (() => GlobalInterface.SpecialRelInputRaw<IAnimeGqlRaw>[]) | GlobalInterface.SpecialRelInputRaw<IAnimeGqlRaw>[];
    relationsManga?: (() => GlobalInterface.SpecialRelInputRaw<IMangaGql>[]) | GlobalInterface.SpecialRelInputRaw<IMangaGql>[];
    staffs?: (() => GlobalInterface.SpecialRelInputRaw<IPersonGql>[]) | GlobalInterface.SpecialRelInputRaw<IPersonGql>[];
    characters?: (() => GlobalInterface.SpecialRelInputRaw<ICharacterGql>[]) | GlobalInterface.SpecialRelInputRaw<ICharacterGql>[];
    tracks?: (() => ITrackGql[]) | ITrackGql[];
    createdAt: Date,
    editedAt: Date,

    updates: (() => IUpdatePopulated[]) | IUpdatePopulated[]
};

export interface IAnimeGqlRaw2 {
    _id: number,
    title?: {
        romaji?: string
        english?: string
        french?: string
        native?: string
        alias?: (() => string[]) | string[]
    };
    date?: MediaDate;
    image?: MediaImage;
    description?: string;
    source?: MediaSource;
    format?: AnimeFormat;
    tags?: MediaTag[];
    status?: MediaStatus;
    episodes?: AnimeEpisode;
    explicitContent?: boolean;
    links?: MediaLink[];
    studios?: ICompanyGql[];
    producers?: ICompanyGql[];
    relations?: GlobalInterface.RelationInput[];
    staffs?: GlobalInterface.SpecialRelInputRaw<IPersonGql>[];
    characters?: GlobalInterface.SpecialRelInputRaw<ICharacterGql>[];
    tracks?: GlobalInterface.SpecialRelInputRaw<ITrackGql>[];
    createdAt: Date,
    editedAt: Date,

    updates: IUpdatePopulated[]
};

type AnimeFormat =
    "TV" |
    "TV_SHORT" |
    "MOVIE" |
    "ONA" |
    "OVA" |
    "SPECIAL";

type AnimeEpisode = {
    airing?: number
    nextAiringDate?: Date
    total?: number
};

