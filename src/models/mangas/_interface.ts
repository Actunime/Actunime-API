import { Document } from "mongoose";
import { MediaTitle, MediaDate, MediaTagInput, MediaStatus, MediaLink, MediaRelationLabel } from "../../types/utils";
import { IAnimePopulated } from "../animes";
import { ICharacterGql } from "../characters";
import { IPersonGql } from "../persons";
import { IUpdatePopulated } from "../updates";

export interface IManga extends Document {
    _id?: number;
    /** Titres du manga */
    title?: MediaTitle
    /** Date de sortie et de fin du manga */
    date?: MediaDate
    /** Bannière et poster */
    image?: MediaImage
    /** Synopsis du manga */
    description?: string
    /** Source du manga */
    source?: MediaSource
    /** Format du manga */
    format?: MangaFormat
    /** Tags du manga */
    tags?: MediaTagInput[]
    /** Status de diffusion du manga */
    status?: MediaStatus
    /** Chapitres du manga */
    chapters: MangaChapter_Volume,
    /** Volumes du manga */
    volumes: MangaChapter_Volume,
    /** Contenue explicite */
    explicitContent?: boolean
    /** Liens officiel au manga */
    links?: MediaLink[]
    /** Producteurs lié au manga */
    producers?: string[];
    /** Relations avec des animes (adapatation ou autre) */
    relationsAnime?: { label: MediaRelationLabel, data: string | IAnimePopulated }[],
    /** Relations avec des mangas (source ou autre) */
    relationsManga?: { label: MediaRelationLabel, data: string | IMangaPopulated }[],
    /** staffs du manga */
    staffs?: { label: string, data: string | IPersonGql }[];
    /** Personnages du manga*/
    characters?: { label: string, data: string | ICharacterGql }[];
    /** Date d'ajout dans la base de donnée */
    createdAt?: Date;
    /** Date de dernière modification BD */
    editedAt?: Date;
    /** Vérifié par le staff */
    verified: boolean;


    /** @Virtuel - Liste des modifications */
    updates: IUpdatePopulated[];
};

export interface IMangaSchema extends IManga {
    _id?: number;
    title?: MediaTitle
    date?: MediaDate
    image?: MediaImage
    description?: string
    source?: MediaSource
    format?: MangaFormat
    tags?: MediaTagInput[]
    status?: MediaStatus
    chapters: MangaChapter_Volume,
    volumes: MangaChapter_Volume,
    explicitContent?: boolean
    links?: MediaLink[]
    producers?: string[];
    relationsAnime?: { label: MediaRelationLabel, data: string }[],
    relationsManga?: { label: MediaRelationLabel, data: string }[],
    staffs?: { label: string, data: string }[];
    characters?: { label: string, data: string }[]
    createdAt?: Date;
    editedAt?: Date;
    verified: boolean
};


export interface IMangaPopulated extends IManga {
    _id?: number;
    title?: MediaTitle
    date?: MediaDate
    image?: MediaImage
    description?: string
    source?: MediaSource
    format?: MangaFormat
    tags?: MediaTagInput[]
    status?: MediaStatus
    chapters: MangaChapter_Volume,
    volumes: MangaChapter_Volume,
    explicitContent?: boolean
    links?: MediaLink[]
    producers?: string[];
    relationsAnime?: { label: MediaRelationLabel, data: IAnimePopulated }[],
    relationsManga?: { label: MediaRelationLabel, data: IMangaPopulated }[],
    staffs?: { label: string, data: string }[];
    characters?: { label: string, data: string }[]
    createdAt?: Date;
    editedAt?: Date;
    updates: IUpdatePopulated[]
    verified: boolean
};

export interface IMangaGql extends IManga {
    title?: MediaTitle
    date?: MediaDate
    image?: MediaImage
    description?: string
    source?: MediaSource
    format?: MangaFormat
    tags?: MediaTagInput[]
    status?: MediaStatus
    chapters: MangaChapter_Volume,
    volumes: MangaChapter_Volume,
    explicitContent?: boolean
    links?: MediaLink[]
    producers?: string[];
    relationsAnime?: { label: MediaRelationLabel, data: string }[],
    relationsManga?: { label: MediaRelationLabel, data: string }[],
    staffs?: { label: string, data: IPersonGql | string }[];
    characters?: { label: string, data: ICharacterGql | string }[]
};


type MangaFormat =
    "MANGA" |
    "MANHWA" |
    "MANHUA"


type MangaAiring = {
    minDate?: Date
    maxDate?: Date
}


type MangaChapter_Volume = {
    airing: number,
    nextAiringDate: MangaAiring,
    total: number
}