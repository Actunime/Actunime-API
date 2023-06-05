import { Document } from "mongoose";
import { IAnimePopulated } from "../animes";
import { ICharacterPopulated } from "../characters/_interface";
import { IMangaPopulated } from "../mangas";
import { ITrackPopulated } from "../tracks";
import { IUpdatePopulated } from "../updates";

type PersonLabel = "artist" | 'actor' | 'staff';

type PersonName = {
    first: string
    end: string
    alias: string[]
}

type PersonGender = "MAN" | "FEMAL" | "NONBINARY";

export interface IPerson extends Document {
    _id: number
    /** Type de personne (artist, acteur, staff) */
    label: PersonLabel
    /** Nom - Prénom et alias */
    name: PersonName
    /** Age de la personne */
    age: number
    /** Date de naissance de la personne */
    dateOfBirth: Date,
    /** Genre de la personne */
    gender: PersonGender,
    /** Biographie de la personne */
    bio: string,
    /** Photo */
    image: string,
    /** Date d'ajout dans la BD */
    createdAt: Date,
    /** Date de dernière modification dans la BD */
    editedAt: Date,
    /** Vérifié par le staff */
    verified: boolean

    /** @virtuel - Liste des modifications */
    updates: IUpdatePopulated[]
    /** @virtuel - Liste des personnages (Sayu) */
    characters?: ICharacterPopulated[]
    /** @virtuel - Liste des musiques (Chanteur) */
    tracks?: ITrackPopulated[]
    /** @virtuel - Liste des animes (Staff) */
    staffAnimes?: IAnimePopulated[]
    /** @virtuel - Liste des mangas (Staff) */
    staffMangas?: IMangaPopulated[]
}

export interface IPersonSchema extends IPerson {
    _id: number
    label: PersonLabel
    name: PersonName
    age: number
    dateOfBirth: Date,
    gender: PersonGender,
    bio: string,
    image: string,
    createdAt: Date,
    editedAt: Date,
    verified: boolean
}

export interface IPersonPopulated extends IPerson {
    _id: number
    label: PersonLabel
    name: PersonName
    age: number
    dateOfBirth: Date,
    gender: PersonGender,
    bio: string,
    image: string,
    createdAt: Date,
    editedAt: Date,
    verified: boolean

    updates: IUpdatePopulated[]
    characters?: ICharacterPopulated[]
    tracks?: ITrackPopulated[]
    staffAnimes?: IAnimePopulated[]
    staffMangas?: IMangaPopulated[]
}

export interface IPersonGql extends IPerson {
    label: PersonLabel
    name: PersonName
    age: number
    dateOfBirth: Date,
    gender: PersonGender,
    bio: string,
    image: string
}