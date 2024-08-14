import { IImage } from './imageType';
import type { IMediaBase, IMediaLink } from './mediaType';
import type { IPaginationResponse } from './paginationType';

export interface IPerson extends IMediaBase {
  name: { first: string; last: string; full: string; alias: string[] };
  birthDate?: Date;
  deathDate?: Date;
  bio?: string;
  avatar?: { id: string; data?: IImage; };
  links?: IMediaLink[];
}

export type IPersonPaginationResponse = IPaginationResponse<IPerson>;
