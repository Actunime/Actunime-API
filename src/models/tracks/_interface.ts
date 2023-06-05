import { Document } from "mongoose"
import { MediaLink } from "../../types/utils"
import { IAnimePopulated } from "../animes"
import { IUpdatePopulated } from "../updates"

type TrackType =
    "OST" |
    "OP" |
    "ED" |
    "INSERT"


export interface ITrack extends Document {
    _id: number
    /** Type de musique OST, OPENING... */
    type: TrackType
    /** Nom de la musique */
    name: string
    /** Artistes */
    artists: string[]
    /** Épisodes dans lequel cette musique a été entendu */
    episodes: number[]
    /** Liens lié a cette musique (youtube, spotify etc...) */
    links: MediaLink[]
    /** Date de sortie de la musique */
    createdDate: Date,
    /** Vérifié par le staff */
    verified: boolean
    /** Date d'ajout dans la BD */
    createdAt: Date
    /** Date de dernière modification dans la BD */
    editedAt: Date

    /** Propriété virtuel - liste des modifications effectué sur le média */
    updates: (string | IUpdatePopulated)[]
}

export interface ITrackSchema extends ITrack {
    _id: number
    type: TrackType
    name: string
    artists: string[]
    episodes: number[]
    links: MediaLink[]
    createdDate: Date,
    createdAt: Date
    editedAt: Date
    verified: boolean
}


export interface ITrackPopulated extends ITrack {
    _id: number
    type: TrackType
    name: string
    artists: string[]
    episodes: number[]
    links: MediaLink[]
    createdDate: Date
    animes: IAnimePopulated[]
    createdAt: Date
    editedAt: Date
    verified: boolean

    updates: IUpdatePopulated[]
}

export interface ITrackGql extends ITrack {
    type: TrackType
    name: string
    artists: string[]
    episodes: number[]
    links: MediaLink[]
    createdDate: Date
}