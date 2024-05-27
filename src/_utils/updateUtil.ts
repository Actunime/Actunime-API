export const UpdateTypeObj = {
  CREATE: "Création",
  CREATE_REQUEST: "Demande de création",
  UPDATE: "Modification",
  UPDATE_REQUEST: "Demande de modification",
};

export type IUpdateType = keyof typeof UpdateTypeObj;
export const UpdateTypeArray = Object.keys(UpdateTypeObj) as IUpdateType[] & [string, ...string[]];
export const UpdateTypeSelection = UpdateTypeArray.map((key) => ({
  label: UpdateTypeObj[key],
  value: key
}))

export const UpdateStatusObj = {
  PENDING: "En attente",
  IN_PROGRESS: "En cours",
  ACCEPTED: "Accepté",
  REJECTED: "Refusé",
  REVERTED: "Annulé",
};

export type IUpdateStatus = keyof typeof UpdateStatusObj;
export const UpdateStatusArray = Object.keys(UpdateStatusObj) as IUpdateStatus[] & [string, ...string[]];

export const UpdateStatusSelection = UpdateStatusArray.map((key) => ({
  label: UpdateStatusObj[key],
  value: key
}))

export const UpdateActionObj = {
  IN_PROGRESS: "En cours",
  REQUEST: "Demande",
  CHANGE: "Modification des modifications",
  ACCEPT: "Accepter",
  REJECT: "Refuser",
  REVERT: "Annuler",
  DIRECT_ACCEPT: "Accepté directement",
}

export type IUpdateAction = keyof typeof UpdateActionObj;
export const UpdateActionArray = Object.keys(UpdateActionObj) as IUpdateAction[] & [string, ...string[]];
export const UpdateActionSelection = UpdateActionArray.map((key) => ({
  label: UpdateActionObj[key],
  value: key
}))