import { Document } from "mongoose";
import { MediaTitle, PersonGender } from "../../types/utils"
import { IAnimePopulated } from "../animes";
import { IMangaPopulated } from "../mangas";
import { IPersonGql, IPersonPopulated } from "../persons";
import { IUpdatePopulated } from "../updates";


export type CharacterSpecies = "ELFE" | "DWARF" | "HUMAN" | "MONSTER";


export interface ICharacter extends Document {
    _id: number
    /** Différentes nom du personnages */
    name: MediaTitle
    /** Age du personnage */
    age: number
    /** Date de naissance du personnage */
    dateOfBirth: Date
    /** Genres du personnage */
    gender: PersonGender
    /** Espèce du personnage */
    species: CharacterSpecies
    /** bio du personnage */
    description: string
    /** Image du personnage */
    image: string
    /** Acteurs du personnage */
    actors: (string | IPersonPopulated | IPersonGql)[]
    /** Date d'ajout dans la BD */
    createdAt: Date
    /** Date de modification dans la BD */
    editedAt: Date
    /** Vérifié par le staff */
    verified: boolean

    /** @virtual - Liste modifications */
    updates: IUpdatePopulated[]
    /** Liste des animes du personnages */
    animes: IAnimePopulated[]
    /** Liste des mangas du personnage */
    mangas: IMangaPopulated[]
}

export interface ICharacterSchema extends ICharacter {
    _id: number
    name: MediaTitle
    age: number
    dateOfBirth: Date
    gender: PersonGender
    species: CharacterSpecies
    description: string
    image: string
    actors: string[]
    createdAt: Date
    editedAt: Date
    verified: boolean
}


export interface ICharacterPopulated extends ICharacter {
    _id: number
    name: MediaTitle
    age: number
    dateOfBirth: Date
    gender: PersonGender
    species: CharacterSpecies
    description: string
    image: string
    actors: IPersonPopulated[]
    createdAt: Date
    editedAt: Date
    verified: boolean

    updates: IUpdatePopulated[]
    animes: IAnimePopulated[]
    mangas: IMangaPopulated[]
}

export interface ICharacterGql extends ICharacter {
    name: MediaTitle
    age: number
    dateOfBirth: Date
    gender: PersonGender
    species: CharacterSpecies
    description: string
    image: string
    actors: (IPersonGql | string)[];
}


export default ICharacterSchema;