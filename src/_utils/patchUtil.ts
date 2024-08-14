export const PatchTypeObj = {
  CREATE: 'Création',
  CREATE_REQUEST: 'Demande de création',
  UPDATE: 'Modification',
  UPDATE_REQUEST: 'Demande de modification'
};

export type IPatchType = keyof typeof PatchTypeObj;
export const PatchTypeArray = Object.keys(PatchTypeObj) as IPatchType[] & [string, ...string[]];
export const PatchTypeSelection = PatchTypeArray.map((key) => ({
  label: PatchTypeObj[key],
  value: key
}));

export const PatchStatusObj = {
  PENDING: 'En attente',
  IN_PROGRESS: 'En cours',
  ACCEPTED: 'Accepté',
  REJECTED: 'Refusé',
  REVERTED: 'Annulé'
};

export type IPatchStatus = keyof typeof PatchStatusObj;
export const PatchStatusArray = Object.keys(PatchStatusObj) as IPatchStatus[] &
  [string, ...string[]];

export const PatchStatusSelection = PatchStatusArray.map((key) => ({
  label: PatchStatusObj[key],
  value: key
}));

export const PatchActionObj = {
  IN_PROGRESS: 'En cours',
  REQUEST: 'Demande',
  CHANGE: 'Modification des modifications',
  ACCEPT: 'Accepter',
  REJECT: 'Refuser',
  REVERT: 'Annuler',
  DIRECT_CREATE: 'Creation sans détours',
  DIRECT_PATCH: 'Mise a jour sans détours'
};

export type IPatchAction = keyof typeof PatchActionObj;
export const PatchActionArray = Object.keys(PatchActionObj) as IPatchAction[] &
  [string, ...string[]];
export const PatchActionSelection = PatchActionArray.map((key) => ({
  label: PatchActionObj[key],
  value: key
}));
