import type { IAnimeFormat } from '../_utils/animeUtil';
import type { ICharacterRole } from '../_utils/characterUtil';
import type { ICharacter } from './characterType';
import type { ICompany } from './companyType';
import type { IGroupe } from './groupeType';
import type { IManga } from './mangaType';
import type { IMediaBase, IMediaDate, IMediaImage, IMediaLink, IMediaTitle } from './mediaType';
import type {
  IMediaGenres,
  IMediaParentLabel,
  IMediaSource,
  IMediaStatus
} from '../_utils/mediaUtil';

import type { IPaginationResponse } from './paginationType';
import type { IPerson } from './personType';
import type { ITrack } from './trackType';
import { IPersonRole } from '../_utils/personUtil';

export interface IAnimeEpisode {
  airing?: number;
  nextAiringDate?: Date;
  total?: number;
  durationMinute?: number;
}

export interface IAnime extends IMediaBase {
  groupe: {
    id: string;
    data?: IGroupe; // Virtual
  };

  parent: {
    id: string;
    parentLabel?: IMediaParentLabel;
    data?: IAnime; // Virtual
  };

  source: {
    id: string;
    sourceLabel?: IMediaSource;
    data?: IManga; // Virtual
  };

  title: IMediaTitle;
  synopsis?: string;
  image?: IMediaImage;
  date?: IMediaDate;
  status: IMediaStatus;
  format: IAnimeFormat;
  vf?: boolean;
  episodes?: IAnimeEpisode;
  adult?: boolean;
  explicit?: boolean;
  genres?: IMediaGenres[];
  // themes?: string[];
  links?: IMediaLink[];

  companys: {
    id: string;
    data?: ICompany; // Virtual
  }[];

  staffs: {
    id: string;
    role?: IPersonRole;
    data?: IPerson; // Virtual
  }[];

  characters: {
    id: string;
    role: ICharacterRole;
    data?: ICharacter; // Virtual
  }[];

  tracks: {
    id: string;
    data?: ITrack; // Virtual
  }[];
}

export type IAnimePaginationResponse = IPaginationResponse<IAnime>;
