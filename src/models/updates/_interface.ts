import { Document } from "mongoose";
import { IUserPopulated } from "../users";

export interface IUpdate extends Document {
    _id?: number
    /** Action (new, delete, update) */
    action?: 'new' | 'update' | 'delete'
    /** Statut */
    status?: 'AWAIT_VERIFICATION' | 'AWAIT_USER_CHANGES'
    /** Nom de la table (animes,mangas ...) */
    dbName?: string
    /** Utilisateur */
    user?: string | IUserPopulated
    /** ID du média modifié */
    data?: number
    /** Modifications effectué sur le personnage (objet avec ce qui a été modifié)*/
    changes?: any
    /** Cas ou la donnée (anime, manga...) a été supprimé de la base de donnée */
    dataDeleted?: boolean
    /** Raison fourni par le moderateur généralement */
    reason?: string
    /** Info supplémentaire fourni par l'utilisateur */
    userTextInfo?: string
    /** id de l'update si l'update actuel dépend d'une autre */
    ref?: number
    /** Liste des updates qui dépends de celle ci */
    references?: number;
    /** Date de création de la modification */
    createdAt?: Date;
    /** Moderateur */
    moderator?: number;
    /** 
     * Modification vérifié par le staff
     * 
     * Si c'est un utilisateur qui fait une modification de lui même 
     * 
     * (changement d'username, displayName...)
     * 
     * alors la modification sera automatiquement vérifié.
     */
    verified?: Boolean;
}

export interface IUpdateSchema extends IUpdate {
    _id?: number
    action: 'new' | 'update' | 'delete'
    dbName: string
    user: string
    data: number
    changes: any
    dataDeleted: boolean
    reason: string
    createdAt: Date;
    verified: Boolean;
}

export interface IUpdatePopulated extends IUpdate {
    _id?: number
    action: 'new' | 'update' | 'delete'
    dbName?: string
    user?: IUserPopulated
    data?: number
    changes?: any
    dataDeleted?: boolean
    reason?: string
    createdAt?: Date;
    verified?: Boolean;
}