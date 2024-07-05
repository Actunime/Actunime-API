export const ActivityTypeObj = {
  PUBLIC: 'Public',
  MEMBER: 'Membre',
  MODERATION: 'Modération',
  SYSTEM: 'Système'
};

export type IActivityType = keyof typeof ActivityTypeObj;
export const ActivityTypeArray = Object.keys(ActivityTypeObj) as IActivityType[] &
  [string, ...string[]];
export const ActivityTypeSelection = ActivityTypeArray.map((key) => ({
  label: ActivityTypeObj[key],
  value: key
}));

export const ActivityActionObj = {
  ROLES_CHANGES: 'Changement de rôles',
  PREMIUM_CHANGES: 'Mise a jour du premium',
  DISABLE_MEMBER: "Désactivation d'un membre",
  ENABLE_MEMBER: "Activation d'un membre",
  REPORT_STATUS_CHANGES: 'Changement du statut du signalement',
  UPDATE_STATUS_CHANGES: 'Changement du statut de la mise à jour',
  UPDATE_EDIT_CHANGES: 'Edition de la mise à jour',

  CREATE_ANIME: "Creation d'un anime",
  CREATE_MANGA: "Creation d'un manga",
  CREATE_PERSON: "Creation d'une personne",
  CREATE_GROUPE: "Creation d'un groupe",
  CREATE_CHARACTER: "Creation d'un personnage",
  CREATE_TRACK: "Creation d'une musique",
  CREATE_COMPANY: "Creation d'une société",
  CREATE_REPORT: "Creation d'un signalement",
  CREATE_IMAGE: "Creation d'une image",

  UPDATE_ANIME: "Modification d'un anime",
  UPDATE_MANGA: "Modification d'un manga",
  UPDATE_PERSON: "Modification d'une personne",
  UPDATE_GROUPE: "Modification d'un groupe",
  UPDATE_CHARACTER: "Modification d'un personnage",
  UPDATE_TRACK: "Modification d'une musique",
  UPDATE_COMPANY: "Modification d'une société",
  UPDATE_REPORT: "Modification d'un signalement",
  UPDATE_UPDATE: "Modification d'une mise à jour",
  UPDATE_IMAGE: "Modification d'une image",

  REQUEST_ANIME: "Demande d'un anime",
  REQUEST_MANGA: "Demande d'un manga",
  REQUEST_PERSON: "Demande d'une personne",
  REQUEST_GROUPE: "Demande d'un groupe",
  REQUEST_CHARACTER: "Demande d'un personnage",
  REQUEST_TRACK: "Demande d'une musique",
  REQUEST_COMPANY: "Demande d'une société",
  REQUEST_IMAGE: "Demande d'une image",

  LOGOUT: 'Deconnexion',
  LOGIN: 'Connexion',
  SIGNUP: 'Inscription',
  PROFILE_CHANGES: 'Changement de profil'
};

export type IActivityAction = keyof typeof ActivityActionObj;
export const ActivityActionArray = Object.keys(ActivityActionObj) as IActivityAction[] &
  [string, ...string[]];
export const ActivityActionSelection = ActivityActionArray.map((key) => ({
  label: ActivityActionObj[key],
  value: key
}));
