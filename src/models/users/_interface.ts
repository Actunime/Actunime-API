import { Document } from "mongoose"
import { IAnimePopulated } from "../animes"
import { ICharacterPopulated } from "../characters"
import { IPersonPopulated } from "../persons"
import { ITrackPopulated } from "../tracks"
import { IUpdatePopulated } from "../updates"

type UserImages = {
    avatar: String
    banner: String
}

export type UserListAnimeStatus = "WATCHING" | "READING" | "PAUSED" | "PLANNING" | "DROPPED";

export interface IUser extends Document {
    _id?: number
    /** ID discord si compte lié */
    discordID?: string
    /** Nom d'utilisateur (unique) */
    username?: string
    /** Email */
    email?: string
    /** Mot de passe (hash) */
    password?: string
    /** Pseudonyme de l'utilisateur */
    displayName?: string
    /** Bio de l'utilisateur */
    bio?: string
    /** Rôles de l'utilisateur (membre, admin, moderateur, premium) */
    roles?: string[]
    /** Image bannière et avatar */
    image?: UserImages
    /** Liste animes */
    animeList?: { status: UserListAnimeStatus, data: string | IAnimePopulated }[]
    /** Liste mangas */
    mangaList?: { status: UserListAnimeStatus, data: string | IAnimePopulated }[]
    /** Liste personnages favoris */
    characterList?: (string | ICharacterPopulated)[]
    /** Liste musiques favorites */
    trackList?: (string | ITrackPopulated)[]
    /** Liste personnes favoristes (staff, acteur, artist) */
    personList?: (string | IPersonPopulated)[]
    /** Amis */
    friendList?: (string | IUserPopulated)[]
    /** Mes abonnées a moi */
    followerList?: (string | IUserPopulated)[]
    /** Ceux a qui je suis abonnée */
    followingList?: (string | IUserPopulated)[]
    /** Informations premium de l'utilisateur */
    premium?: { active: boolean, since: Date, end: Date }
    /** Liste des contributions de l'utilisateur */
    contributions?: IUpdatePopulated[]
    /** Utilisateur email vérifié */
    verified?: boolean
    /** Date de création du compte */
    createdAt?: Date
    /** Date de dernière modification du compte */
    editedAt?: Date


    /** Propriété virtuel - liste des modifications effectué */
    updates?: (string | IUpdatePopulated)[]
}

export interface IUserSchema extends IUser {
    _id?: number
    discordID?: string
    username?: string
    displayName?: string
    bio?: string
    roles?: string[]
    image?: UserImages
    animes?: { status: UserListAnimeStatus, data: string }[]
    mangas?: { status: UserListAnimeStatus, data: string }[]
    characters?: string[]
    tracks?: string[]
    persons?: string[]
    friends?: string[]
    followers?: string[]
    followings?: string[]
    premium?: { active: boolean, since: Date, end: Date }
    contributions?: IUpdatePopulated[]
    verified?: boolean
    createdAt?: Date
    editedAt?: Date
}

export interface IUserPopulated extends IUser {
    _id: number
    discordID: string
    username: string
    displayName: string
    bio: string
    roles: string[]
    image: UserImages
    animes: { status: UserListAnimeStatus, data: IAnimePopulated }[]
    mangas: { status: UserListAnimeStatus, data: IAnimePopulated }[]
    characters: ICharacterPopulated[]
    tracks: ITrackPopulated[]
    persons: IPersonPopulated[]
    friends?: IUserPopulated[]
    followers?: IUserPopulated[]
    followings?: IUserPopulated[]
    premium?: { active: boolean, since: Date, end: Date }
    contributions: IUpdatePopulated[]
    verified: boolean
    createdAt: Date
    editedAt: Date

    updates: IUpdatePopulated[]
};