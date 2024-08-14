import type { ITargetPath } from '../_utils/global';
import { IActivity_Pagination_ZOD } from '../_validation/activityZOD';
import type { IAnime_Pagination_ZOD, ICreate_Anime_ZOD } from '../_validation/animeZOD';
import type { ICharacter_Pagination_ZOD, ICreate_Character_ZOD } from '../_validation/characterZOD';
import type { ICompany_Pagination_ZOD, ICreate_Company_ZOD } from '../_validation/companyZOD';
import type { ICreate_Groupe_ZOD, IGroupe_Pagination_ZOD } from '../_validation/groupeZOD';
import type { ICreate_Manga_ZOD, IManga_Pagination_ZOD } from '../_validation/mangaZOD';
import type { ICreate_Person_ZOD, IPerson_Pagination_ZOD } from '../_validation/personZOD';
import { IReport_Pagination_ZOD } from '../_validation/reportZOD';
import type { ICreate_Track_ZOD, ITrack_Pagination_ZOD } from '../_validation/trackZOD';
import { IPatch_Pagination_ZOD } from '../_validation/patchZOD';
import { IUser_Pagination_ZOD, IUser_Update_ZOD } from '../_validation/userZOD';

export type ITargetPathZODType<T extends ITargetPath> = T extends 'Groupe'
  ? ICreate_Groupe_ZOD
  : T extends 'Manga'
    ? ICreate_Manga_ZOD
    : T extends 'Anime'
      ? ICreate_Anime_ZOD
      : T extends 'Character'
        ? ICreate_Character_ZOD
        : T extends 'Person'
          ? ICreate_Person_ZOD
          : T extends 'Track'
            ? ICreate_Track_ZOD
            : T extends 'Company'
              ? ICreate_Company_ZOD
              : T extends 'User'
                ? IUser_Update_ZOD
                : any;

export type ITargetPathZODPaginationType<T extends ITargetPath> = T extends 'User'
  ? IUser_Pagination_ZOD
  : T extends 'Groupe'
    ? IGroupe_Pagination_ZOD
    : T extends 'Manga'
      ? IManga_Pagination_ZOD
      : T extends 'Anime'
        ? IAnime_Pagination_ZOD
        : T extends 'Character'
          ? ICharacter_Pagination_ZOD
          : T extends 'Person'
            ? IPerson_Pagination_ZOD
            : T extends 'Track'
              ? ITrack_Pagination_ZOD
              : T extends 'Company'
                ? ICompany_Pagination_ZOD
                : T extends 'Update'
                  ? IPatch_Pagination_ZOD
                  : T extends 'Activity'
                    ? IActivity_Pagination_ZOD
                    : T extends 'Report'
                      ? IReport_Pagination_ZOD
                      : any;
