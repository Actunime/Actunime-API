import { ITrackType } from '../_utils/trackUtil';
import { IImage } from './imageType';
import { IMediaBase, IMediaLink } from './mediaType';
import { IPaginationResponse } from './paginationType';
import { IPerson } from './personType';

export interface ITrack extends IMediaBase {
  type: ITrackType;
  name: { default: string; native: string };
  pubDate: Date | string;
  bio?: string;
  cover?: {
    id: string;
    data?: IImage; // Virtual
  };
  artists: { id: string; data?: IPerson }[];
  links: IMediaLink[];
}

export interface ITrackPopulated extends Omit<ITrack, 'persons'> {
  persons: IPerson[];
}

export type ITrackPaginationResponse = IPaginationResponse<ITrack>;
