import { ITargetPath, TargetPathObj } from './global';

export function HumanizeActionOnMedia(action: string, mediaName: ITargetPath) {
  let humanize = '';
  switch (action) {
    case 'ANIME_ADD':
      humanize = `a ajouté un/e ${TargetPathObj[mediaName]}`;
      break;
    case 'ANIME_EDIT':
      humanize = `a modifié un/e ${TargetPathObj[mediaName]}`;
      break;
    case 'ANIME_DELETE':
      humanize = `a supprimé un/e ${TargetPathObj[mediaName]}`;
      break;
  }
  if (!humanize) humanize = 'action inconnue';
  return humanize;
}

export function HumanizeDate(date?: string | Date, noTime: boolean = false) {
  let humanize = '';
  try {
    if (!date) return 'Non défini';
    const formatedDate = date instanceof Date ? date : new Date(date);
    const dateInput = formatedDate.getDate() + formatedDate.getMonth() + formatedDate.getFullYear();
    const currentDate = new Date().getDate() + new Date().getMonth() + new Date().getFullYear();

    const localTime = noTime
      ? formatedDate.toLocaleDateString()
      : formatedDate.toLocaleTimeString();
    const local = noTime ? formatedDate.toLocaleDateString() : formatedDate.toLocaleString();
    if (dateInput === currentDate) {
      humanize = noTime ? localTime : "Aujourd'hui à " + localTime;
    } else {
      humanize = local;
    }
  } catch {
    humanize = 'Date invalide.';
  }
  return humanize;
}
