import { IUserRoles } from "@actunime/types";



const realmRoles = {
    // Administrateurs modifications directes;
    "GROUPE_VERIFY": "Vérifier un groupe",
    "GROUPE_ADD": "Ajouter un groupe",
    "GROUPE_PATCH": "Modifier un groupe",
    "GROUPE_DELETE": "Supprimer un groupe",
    "GROUPE_REQUEST_DELETE": "Supprimer la demande d'ajout/modification d'un groupe",
    /** */
    "ANIME_VERIFY": "Vérifier un anime",
    "ANIME_ADD": "Ajouter un anime",
    "ANIME_PATCH": "Modifier un anime",
    "ANIME_DELETE": "Supprimer un anime",
    "ANIME_REQUEST_DELETE": "Supprimer la demande d'ajout/modification d'un anime",
    /** */
    "MANGA_VERIFY": "Vérifier un manga",
    "MANGA_ADD": "Ajouter un manga",
    "MANGA_PATCH": "Modifier un manga",
    "MANGA_DELETE": "Supprimer un manga",
    "MANGA_REQUEST_DELETE": "Supprimer la demande d'ajout/modification d'un manga",
    /** */
    "CHARACTER_VERIFY": "Vérifier un personnage",
    "CHARACTER_ADD": "Ajouter un personnage",
    "CHARACTER_PATCH": "Modifier un personnage",
    "CHARACTER_DELETE": "Supprimer un personnage",
    "CHARACTER_REQUEST_DELETE": "Supprimer la demande d'ajout/modification d'un personnage",
    /** */
    "PERSON_VERIFY": "Vérifier une personnalité",
    "PERSON_ADD": "Ajouter une personnalité",
    "PERSON_PATCH": "Modifier une personnalité",
    "PERSON_DELETE": "Supprimer une personnalité",
    "PERSON_REQUEST_DELETE": "Supprimer la demande d'ajout/modification d'une personnalité",
    /** */
    "COMPANY_VERIFY": "Vérifier une société",
    "COMPANY_ADD": "Ajouter une société",
    "COMPANY_PATCH": "Modifier une société",
    "COMPANY_DELETE": "Supprimer une société",
    "COMPANY_REQUEST_DELETE": "Supprimer la demande d'ajout/modification d'une société",
    /** */
    "TRACK_VERIFY": "Vérifier une musique",
    "TRACK_ADD": "Ajouter une musique",
    "TRACK_PATCH": "Modifier une musique",
    "TRACK_DELETE": "Supprimer une musique",
    "TRACK_REQUEST_DELETE": "Supprimer la demande d'ajout/modification d'une musique",
    /** */
    "IMAGE_VERIFY": "Vérifier une image",
    "IMAGE_ADD": "Ajouter une image",
    "IMAGE_PATCH": "Modifier une image",
    "IMAGE_DELETE": "Supprimer une image",
    "IMAGE_REQUEST_DELETE": "Supprimer la demande d'ajout/modification d'une image",



    // Modérateurs gestions des demandes
    "ANIME_REQUEST_VERIFY": "Accepter/Refuser la demande d'ajout/modification d'un anime",
    "ANIME_REQUEST_PATCH": "Modifier la demande d'ajout/modification d'un anime",

    // Membres permissions public
    "ANIME_ADD_REQUEST": "Demander l'ajout d'un anime",
    "ANIME_PATCH_REQUEST": "Demande la modification d'un anime",
    /** */
    "GROUPE_ADD_REQUEST": "Demander l'ajout d'un groupe",
    "GROUPE_PATCH_REQUEST": "Demande la modification d'un groupe",
    /** */
    "IMAGE_ADD_REQUEST": "Demander l'ajout d'une image",
    "IMAGE_PATCH_REQUEST": "Demande la modification d'une image",
    /** */
    "MANGA_ADD_REQUEST": "Demander l'ajout d'un manga",
    "MANGA_PATCH_REQUEST": "Demande la modification d'un manga",
    /** */
    "CHARACTER_ADD_REQUEST": "Demander l'ajout d'un personnage",
    "CHARACTER_PATCH_REQUEST": "Demande la modification d'un personnage",
    /** */
    "PERSON_ADD_REQUEST": "Demander l'ajout d'une personnalité",
    "PERSON_PATCH_REQUEST": "Demande la modification d'une personnalité",
    /** */
    "COMPANY_ADD_REQUEST": "Demander l'ajout d'une société",
    "COMPANY_PATCH_REQUEST": "Demande la modification d'une société",
    /** */
    "TRACK_ADD_REQUEST": "Demander l'ajout d'une musique",
    "TRACK_PATCH_REQUEST": "Demande la modification d'une musique",
}

export type IRealmRole = keyof typeof realmRoles;

export const CheckRealmRoles = (roles: IRealmRole[], accountRoles: (IRealmRole | IUserRoles)[], strict: boolean = true) => {
    console.log("CheckRealmRoles", roles, "<==>", accountRoles);
    if (!strict)
        return roles.some((role) => accountRoles.includes(role));
    return roles.every(role => accountRoles.includes(role));
}
