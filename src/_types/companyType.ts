import { IImage } from "./imageType";
import type { IMediaBase, IMediaLink } from "./mediaType";
import type { IPaginationResponse } from "./paginationType";

export interface ICompany extends IMediaBase {
  type: "STUDIO" | "PRODUCER";
  name: string;
  bio?: string;
  links?: IMediaLink[];
  images?: {
    id: string;
    data?: IImage; // Virtual
  }[];
  createdDate?: Date | string;
}

export type ICompanyPaginationResponse = IPaginationResponse<ICompany>;
