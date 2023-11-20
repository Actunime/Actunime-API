import { CharacterRequestModel, CharacterRequestProps } from "../charactersRequests/_interfaces"
import { PersonRequestProps } from "../personsRequests/_interfaces"
import { TrackRequestProps } from "../tracksRequests/_interfaces"
import { Document } from "mongoose"


export interface AnimeRequestProps {
    title: {
        default: string,
        romaji: string,
        native: string,
        alias: string[]
    }
    date: {
        start: string,
        end: string
    },
    image: {
        poster: string,
        banner: string
    },
    synopsis: string,
    source: string,
    format: string,
    genres: string[],
    themes: string[],
    status: string,
    episodes: {
        airing: string,
        nextAiringDate: string,
        total: string,
    }
    adult: boolean,
    explicit: boolean,
    links: { name: string, value: string }[],
    companys: CompanyForAnimeRequest,
    staffs: StaffForAnimeRequest,
    characters: CharacterForAnimeRequest,
    tracks: TrackForAnimeRequest
};


interface ExistRelation {
    relationDesc: string;
    id: number
}

export interface CharacterWithAnime {
    relationDesc: string,
    data: CharacterRequestProps
}

export interface CharacterModelWithAnime {
    relationDesc: string,
    data: Document<unknown, any, CharacterRequestModel> & Omit<CharacterRequestModel & Required<{ _id: number; }>, never>
}

interface CharacterForAnimeRequest {
    old: ExistRelation[],
    new: CharacterWithAnime[]
}

interface CompanyForAnimeRequest {
    old: number[],
    new: []
}

interface PersonForStaff {
    relationDesc: String
    data: PersonRequestProps
}

interface StaffForAnimeRequest {
    old: ExistRelation[],
    new: PersonForStaff[]
}

interface TrackForAnimeRequest {
    old: number[],
    new: TrackRequestProps[]
}