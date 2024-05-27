import { ICharacterGender, ICharacterSpecies } from "../_utils/characterUtil";
import { IMediaBase } from "./mediaType";
import type { IPaginationResponse } from "./paginationType";
import type { IPerson } from "./personType";

export interface ICharacter extends IMediaBase {
  name: { first: string, last: string, full: string, alias: string[] };
  age: number;
  birthDate: Date | string;
  gender: ICharacterGender;
  species: ICharacterSpecies;
  bio: string;
  image: string;
  actors: {
    id: string,
    data?: IPerson  // Virtual
  }[];
}


export type ICharacterPaginationResponse =
  IPaginationResponse<ICharacter>;
