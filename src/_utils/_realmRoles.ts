import { IUserRoles } from '@actunime/types';
import { DevLog } from '../_lib/logger';

export const realmRoles = {
  // Administrateurs modifications directes;
  GROUPE_VERIFY: 'Vérifier un groupe',
  GROUPE_CREATE: 'Ajouter un groupe',
  GROUPE_PATCH: 'Modifier un groupe',
  GROUPE_DELETE: 'Supprimer un groupe',
  GROUPE_REQUEST_DELETE:
    "Supprimer la demande d'ajout/modification d'un groupe",
  /** */
  ANIME_VERIFY: 'Vérifier un anime',
  ANIME_CREATE: 'Ajouter un anime',
  ANIME_PATCH: 'Modifier un anime',
  ANIME_DELETE: 'Supprimer un anime',
  ANIME_REQUEST_DELETE: "Supprimer la demande d'ajout/modification d'un anime",
  /** */
  MANGA_VERIFY: 'Vérifier un manga',
  MANGA_CREATE: 'Ajouter un manga',
  MANGA_PATCH: 'Modifier un manga',
  MANGA_DELETE: 'Supprimer un manga',
  MANGA_REQUEST_DELETE: "Supprimer la demande d'ajout/modification d'un manga",
  /** */
  CHARACTER_VERIFY: 'Vérifier un personnage',
  CHARACTER_CREATE: 'Ajouter un personnage',
  CHARACTER_PATCH: 'Modifier un personnage',
  CHARACTER_DELETE: 'Supprimer un personnage',
  CHARACTER_REQUEST_DELETE:
    "Supprimer la demande d'ajout/modification d'un personnage",
  /** */
  PERSON_VERIFY: 'Vérifier une personnalité',
  PERSON_CREATE: 'Ajouter une personnalité',
  PERSON_PATCH: 'Modifier une personnalité',
  PERSON_DELETE: 'Supprimer une personnalité',
  PERSON_REQUEST_DELETE:
    "Supprimer la demande d'ajout/modification d'une personnalité",
  /** */
  COMPANY_VERIFY: 'Vérifier une société',
  COMPANY_CREATE: 'Ajouter une société',
  COMPANY_PATCH: 'Modifier une société',
  COMPANY_DELETE: 'Supprimer une société',
  COMPANY_REQUEST_DELETE:
    "Supprimer la demande d'ajout/modification d'une société",
  /** */
  TRACK_VERIFY: 'Vérifier une musique',
  TRACK_CREATE: 'Ajouter une musique',
  TRACK_PATCH: 'Modifier une musique',
  TRACK_DELETE: 'Supprimer une musique',
  TRACK_REQUEST_DELETE:
    "Supprimer la demande d'ajout/modification d'une musique",
  /** */
  IMAGE_VERIFY: 'Vérifier une image',
  IMAGE_CREATE: 'Ajouter une image',
  IMAGE_PATCH: 'Modifier une image',
  IMAGE_DELETE: 'Supprimer une image',
  IMAGE_REQUEST_DELETE: "Supprimer la demande d'ajout/modification d'une image",
  /** */
  USER_CREATE: 'Ajouter un utilisateur',
  USER_PATCH: 'Modifier un utilisateur',
  USER_DELETE: 'Supprimer un utilisateur',

  // Modérateurs gestions des demandes
  ANIME_REQUEST_VERIFY:
    "Accepter/Refuser la demande d'ajout/modification d'un anime",
  ANIME_REQUEST_PATCH: "Modifier la demande d'ajout/modification d'un anime",
  /** */
  GROUPE_REQUEST_VERIFY:
    "Accepter/Refuser la demande d'ajout/modification d'un groupe",
  GROUPE_REQUEST_PATCH: "Modifier la demande d'ajout/modification d'un groupe",
  /** */
  IMAGE_REQUEST_VERIFY:
    "Accepter/Refuser la demande d'ajout/modification d'une image",
  IMAGE_REQUEST_PATCH: "Modifier la demande d'ajout/modification d'une image",
  /** */
  MANGA_REQUEST_VERIFY:
    "Accepter/Refuser la demande d'ajout/modification d'un manga",
  MANGA_REQUEST_PATCH: "Modifier la demande d'ajout/modification d'un manga",
  /** */
  CHARACTER_REQUEST_VERIFY:
    "Accepter/Refuser la demande d'ajout/modification d'un personnage",
  CHARACTER_REQUEST_PATCH:
    "Modifier la demande d'ajout/modification d'un personnage",
  /** */
  PERSON_REQUEST_VERIFY:
    "Accepter/Refuser la demande d'ajout/modification d'une personne",
  PERSON_REQUEST_PATCH:
    "Modifier la demande d'ajout/modification d'une personne",
  /** */
  COMPANY_REQUEST_VERIFY:
    "Accepter/Refuser la demande d'ajout/modification d'une société",
  COMPANY_REQUEST_PATCH:
    "Modifier la demande d'ajout/modification d'une société",
  /** */
  TRACK_REQUEST_VERIFY:
    "Accepter/Refuser la demande d'ajout/modification d'une musique",
  TRACK_REQUEST_PATCH: "Modifier la demande d'ajout/modification d'une musique",

  // Membres permissions public
  ANIME_CREATE_REQUEST: "Demander l'ajout d'un anime",
  ANIME_PATCH_REQUEST: "Demande la modification d'un anime",
  /** */
  GROUPE_CREATE_REQUEST: "Demander l'ajout d'un groupe",
  GROUPE_PATCH_REQUEST: "Demande la modification d'un groupe",
  /** */
  IMAGE_CREATE_REQUEST: "Demander l'ajout d'une image",
  IMAGE_PATCH_REQUEST: "Demande la modification d'une image",
  /** */
  MANGA_CREATE_REQUEST: "Demander l'ajout d'un manga",
  MANGA_PATCH_REQUEST: "Demande la modification d'un manga",
  /** */
  CHARACTER_CREATE_REQUEST: "Demander l'ajout d'un personnage",
  CHARACTER_PATCH_REQUEST: "Demande la modification d'un personnage",
  /** */
  PERSON_CREATE_REQUEST: "Demander l'ajout d'une personnalité",
  PERSON_PATCH_REQUEST: "Demande la modification d'une personnalité",
  /** */
  COMPANY_CREATE_REQUEST: "Demander l'ajout d'une société",
  COMPANY_PATCH_REQUEST: "Demande la modification d'une société",
  /** */
  TRACK_CREATE_REQUEST: "Demander l'ajout d'une musique",
  TRACK_PATCH_REQUEST: "Demande la modification d'une musique",
};

export type IRealmRole = keyof typeof realmRoles;

export const CheckRealmRoles = (
  roles: IRealmRole[],
  accountRoles: (IRealmRole | IUserRoles)[],
  strict: boolean = true
) => {
  DevLog(
    `Roles requis : ${roles?.join(', ')}, user roles : ${accountRoles?.join(
      ', '
    )} | (strict: ${strict})`,
    'debug'
  );
  // console.log("CheckRealmRoles", roles, "<==>", accountRoles);
  let valid = false;

  if (!strict)
    valid = roles.some((role) => accountRoles.find((r) => r === role));
  else valid = roles.every((role) => accountRoles.find((r) => r === role));

  DevLog(`Roles validées : ${valid}`, 'debug');

  return valid;
};
