import { Schema } from 'mongoose';
import { IPaginationResponse } from './paginationType';
import { IImageLabel } from '../_utils/imageUtil';

export interface IImage<T = any> {
  _id: Schema.Types.ObjectId;
  id: string;
  label: IImageLabel;
  url: string; // Virtual
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IImagePaginationResponse extends IPaginationResponse<IImage> {}
