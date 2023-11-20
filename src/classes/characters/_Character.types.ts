import { PersonGraphqlProps } from "../persons/_Person.types";



export interface CharacterProps {
    // _id?: number;
    // id?: number,
    name?: {
        start: string,
        end: string,
        alias: string[]
    }
    age?: number,
    birthDate?: string,
    gender?: string,
    species?: string,
    bio?: string,
    image?: string,
    actors?: number[]
}


export interface CharacterInDB {
    _id?: number;
    id?: number;
    updates: {
        versionId: number,
        data: CharacterProps, // Contient que ce qui a été modifié par rapport a toutes les version précédente
        createdAt: Date, // Date a la quel la modification a été faite
        author: any // Utilisateur a l'origine de la modification
        moderator: any // moderateur a l'origine de l'acceptation
        visible: boolean // Si la modification doit être retourné ou non (considéré comme une modification annulé)
        deletedReason: string;
        deletedAt: Date | null
    }[]
    updatesRequests: {
        versionId: number,
        data: CharacterProps, // Contient que ce qui a été modifié par rapport a toutes les version précédente
        createdAt: Date, // Date a la quel la modification a été demandé
        author: any // Utilisateur a l'origine de la demande de modification
        status: 'UNVERIFIED' | 'REJECTED'; // Statut de la requête
        rejectedReason: string; // Raison du refus si refusé;
        acceptNewUpdateFromAuthor: boolean; // Vous pouvez laisser l'auteur modifier et relancé cette demande de modification.
        deletedAt: Date | null // Doit être défini en cas de refus, il faudra supprimer au bout d'un moment si aucune activité.
    }[] // Modifications en attente
    visible: boolean; // Visible par le public et dans les résultats de recherche.
}


export interface CharacterGraphqlProps {
    name?: {
        start: string,
        end: string,
        alias: string[]
    }
    age?: number,
    birthDate?: string,
    gender?: string,
    species?: string,
    bio?: string,
    image?: string,
    actors?: ICharacterActorsGraphql
}

export interface ICharacterActorsGraphql {
    old: number[],
    new: PersonGraphqlProps[]
}