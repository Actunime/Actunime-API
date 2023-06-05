import { Document } from "mongoose"
import { IAnimePopulated } from "../animes"
import { IMangaPopulated } from "../mangas"
import { IUpdatePopulated } from "../updates"

export interface ICompany extends Document {
    _id: number
    /** Nom du studio ou producteur */
    name: string
    /** Site officiel */
    siteUrl: string
    /** Date de création */
    createdDate: Date
    /** Date d'ajout base de donnée */
    createdAt: Date
    /** Date dernière modification dans la BD */
    editedAt: Date
    /** Vérifié par le staff */
    verified: boolean

    /** Liste des dernières modifications  */
    updates: IUpdatePopulated[]
    /** Liste des animes (en tant que studio) */
    animeStudios: IAnimePopulated[]
    /** Liste des animes (en tant que producteur) */
    animeProducers: IAnimePopulated[]
    /** Liste des mangas (en tant que producteur) */
    mangaProducers: IMangaPopulated[]
}

export interface ICompanySchema extends ICompany {
    _id: number
    name: string
    siteUrl: string
    createdDate: Date
    createdAt: Date
    editedAt: Date
    verified: boolean
}

export interface ICompanyPopulated extends ICompany {
    _id: number
    name: string
    siteUrl: string
    createdDate: Date
    createdAt: Date
    editedAt: Date
    verified: boolean

    updates: IUpdatePopulated[]
    animeStudios: IAnimePopulated[]
    animeProducers: IAnimePopulated[]
    mangaProducers: IMangaPopulated[]
}

export interface ICompanyGql extends ICompany {
    name: string
    siteUrl: string
    createdDate: Date
}