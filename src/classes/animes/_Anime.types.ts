import { CharacterRequestClassProps } from "../characters/CharacterRequest.class";
import { CompanyClassProps } from "../companys/Company.class";
import { Document } from 'mongoose';
import { CompanyGraphqlProps } from "../companys/Companys.types";
import { PersonGraphqlProps } from "../persons/_Person.types";
import { TrackGraphqlProps } from "../tracks/_Track.types";

export interface IAnimeTitle {
    default: string,
    romaji: string,
    native: string,
    alias: string[]
}

export interface IAnimeDate {
    start: string,
    end: string
}

export interface IAnimeImage {
    poster: string,
    banner: string
}

export interface IAnimeEpisodes {
    airing: string,
    nextAiringDate: string,
    total: string,
}

export interface IAnimeRelation {
    relationDesc: string;
    id: number
}

export type IAnimeLink = { name: string, value: string }[]


export interface AnimeProps {
    _id?: number;
    // id?: number;

    title?: IAnimeTitle;
    date?: IAnimeDate;
    image?: IAnimeImage;
    synopsis?: string;
    source?: string;
    format?: string;
    genres?: string[];
    themes?: string[];
    status?: string;
    episodes?: IAnimeEpisodes;
    adult?: boolean;
    explicit?: boolean;
    links?: IAnimeLink;
    companys?: number[];
    staffs?: IAnimeRelation[];
    characters?: IAnimeRelation[];
    tracks?: IAnimeTrackRelation[]


    // updates: AnimeProps[] // Modifications acceptées
    // updatesRequests: AnimeProps[] // Modifications en attente
}

export interface AnimeInDB {
    _id?: number;
    id?: number;
    updates: {
        versionId: number,
        data: AnimeProps, // Contient que ce qui a été modifié par rapport a toutes les version précédente
        createdAt: Date, // Date a la quel la modification a été faite
        author: any // Utilisateur a l'origine de la modification
        moderator: any // moderateur a l'origine de l'acceptation
        visible: boolean // Si la modification doit être retourné ou non (considéré comme une modification annulé)
        deletedReason: string;
        deletedAt: Date | null
    }[]
    updatesRequests: {
        versionId: number,
        data: AnimeProps, // Contient que ce qui a été modifié par rapport a toutes les version précédente
        createdAt: Date, // Date a la quel la modification a été demandé
        author: any // Utilisateur a l'origine de la demande de modification
        status: 'UNVERIFIED' | 'REJECTED'; // Statut de la requête
        rejectedReason: string; // Raison du refus si refusé;
        acceptNewUpdateFromAuthor: boolean; // Vous pouvez laisser l'auteur modifier et relancé cette demande de modification.
        deletedAt: Date | null // Doit être défini en cas de refus, il faudra supprimer au bout d'un moment si aucune activité.
    }[] // Modifications en attente
    visible: boolean; // Visible par le public et dans les résultats de recherche.
}

export interface IAnimeCharacterRelation {
    relationDesc: string,
    // data: CharacterRequestProps
    data: CharacterRequestClassProps
}

// export interface CharacterModelWithAnime {
//     relationDesc: string,
//     // data: Document<unknown, any, CharacterRequestModel> & Omit<CharacterRequestModel & Required<{ _id: number; }>, never>
//     data: Document<unknown, any, any> & Omit<any & Required<{ _id: number; }>, never>
// }

export interface IAnimeCharactersGraphql {
    old: IAnimeRelation[],
    new: IAnimeCharacterRelation[]
}

export interface IAnimeCompanysGraphql {
    old: number[],
    new: CompanyGraphqlProps[]
}

export interface IAnimeStaffRelation {
    relationDesc: string
    // data: PersonRequestProps
    data: PersonGraphqlProps
}

export interface IAnimeStaffsGraphql {
    old: IAnimeRelation[],
    new: IAnimeStaffRelation[]
}

export interface IAnimeTrackGraphqlRelation {
    episodes: number[],
    data: TrackGraphqlProps
}

export interface IAnimeTrackRelation {
    episodes: number[],
    id: number
}

export interface IAnimeTracksGraphql {
    old: IAnimeTrackRelation[],
    // new: TrackRequestProps[]
    new: IAnimeTrackGraphqlRelation[]
}

export interface AnimeGraphqlProps {
    title?: IAnimeTitle;
    date?: IAnimeDate;
    image?: IAnimeImage;
    synopsis?: string;
    source?: string;
    format?: string;
    genres?: string[];
    themes?: string[];
    status?: string;
    episodes?: IAnimeEpisodes;
    adult?: boolean;
    explicit?: boolean;
    links?: IAnimeLink;
    companys?: IAnimeCompanysGraphql
    staffs?: IAnimeStaffsGraphql
    characters?: IAnimeCharactersGraphql
    tracks?: IAnimeTracksGraphql
}


export type IAnimeDocument = Document<unknown, any, AnimeProps> & Omit<AnimeProps & Required<{
    _id: number;
}>, never>