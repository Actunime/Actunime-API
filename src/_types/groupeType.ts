import { IAnime } from './animeType';
import { IManga } from './mangaType';
import { IMediaBase } from './mediaType';
import { IPaginationResponse } from './paginationType';

export interface IGroupe extends IMediaBase {
  name: string;
  animes?: IAnime[]; // Virtual
  mangas?: IManga[]; // Virtual
}

export type IGroupePaginationResponse = IPaginationResponse<IGroupe>;
// export interface IGroupePaginationResponse extends IPaginationResponse<IGroupe> { }
