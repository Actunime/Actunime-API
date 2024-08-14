import type { IActivity } from '../_types/activityType';
import type { IAnime } from '../_types/animeType';
import type { ICharacter } from '../_types/characterType';
import type { ICompany } from '../_types/companyType';
import type { IGroupe } from '../_types/groupeType';
import type { IManga } from '../_types/mangaType';
import type { IPerson } from '../_types/personType';
import type { IReport } from '../_types/reportType';
import type { ITrack } from '../_types/trackType';
import type { IPatch } from '../_types/patchType';
import type { IUser } from '../_types/userType';

export const TargetPathObj = {
  User: 'Utilisateur',
  // Medias
  Groupe: 'Groupe',
  Manga: 'Manga',
  Anime: 'Anime',
  Person: 'Personne',
  Character: 'Personnage',
  Track: 'Musique',
  Company: 'Société',
  //
  Image: 'Image',
  Update: 'Mise à jour',
  Activity: 'Activité',
  Report: 'Signalement',
  DisabledUser: 'Compte désactivé',
  PremiumUser: 'Compte premium'
};

export type ITargetPath = keyof typeof TargetPathObj;
export const TargetPathArray = Object.keys(TargetPathObj) as ITargetPath[] & [string, ...string[]];
export const TargetPathSelection = TargetPathArray.map((key) => ({
  label: TargetPathObj[key],
  value: key
}));

export type ITargetPathType<T extends ITargetPath> = T extends 'User'
  ? IUser
  : T extends 'Groupe'
    ? IGroupe
    : T extends 'Manga'
      ? IManga
      : T extends 'Anime'
        ? IAnime
        : T extends 'Character'
          ? ICharacter
          : T extends 'Person'
            ? IPerson
            : T extends 'Track'
              ? ITrack
              : T extends 'Company'
                ? ICompany
                : T extends 'Update'
                  ? IPatch
                  : T extends 'Activity'
                    ? IActivity
                    : T extends 'Report'
                      ? IReport
                      : T extends 'DisabledUser'
                        ? IUser
                        : T extends 'PremiumUser'
                          ? IUser
                          : any;
