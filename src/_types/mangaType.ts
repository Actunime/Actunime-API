import { ICharacterRole } from '../_utils/characterUtil';
import { IMangaFormat } from '../_utils/mangaUtil';
import { IMediaGenres, IMediaParentLabel, IMediaSource, IMediaStatus } from '../_utils/mediaUtil';
import { IPersonRole } from '../_utils/personUtil';
import { IAnime } from './animeType';
import { ICharacter } from './characterType';
import { ICompany } from './companyType';
import { IGroupe } from './groupeType';
import { IImage } from './imageType';
import { IMediaBase, IMediaDate, IMediaLink, IMediaTitle } from './mediaType';
import { IPaginationResponse } from './paginationType';
import { IPerson } from './personType';

export interface IMangaChapterVolums {
  airing?: number;
  nextAiringDate?: Date | string;
  total?: number;
}
export interface IManga extends IMediaBase {
  groupe?: {
    id: string;
    data?: IGroupe; // Virtual
  };

  parent?: {
    id: string;
    parentLabel?: IMediaParentLabel;
    data?: IAnime; // Virtual
  };

  title: IMediaTitle;
  date?: IMediaDate;
  synopsis?: string;

  source?: {
    id: string;
    sourceLabel?: IMediaSource;
    data?: IManga; // Virtual
  };

  format?: IMangaFormat;
  vf?: boolean;
  genres?: IMediaGenres[];
  themes?: string[];
  status?: IMediaStatus;
  chapters?: IMangaChapterVolums;
  volumes?: IMangaChapterVolums;
  adult?: boolean;
  explicit?: boolean;
  links?: IMediaLink[];

  cover?: {
    id: string;
    data?: IImage; // Virtual
  };
  banner?: {
    id: string;
    data?: IImage; // Virtual
  };
  companys?: {
    id: string;
    data?: ICompany;
  }[];

  staffs?: {
    id: string;
    role?: IPersonRole;
    data?: IPerson;
  }[];

  characters?: {
    id: string;
    role: ICharacterRole;
    data?: ICharacter;
  }[];
}

export type IMangaPaginationResponse = IPaginationResponse<IManga>;
