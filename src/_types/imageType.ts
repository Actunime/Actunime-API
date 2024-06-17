import { Schema } from 'mongoose';
import { ITargetPath } from '../_utils/global';
import { IPaginationResponse } from './paginationType';

export interface IImage<T = any> {
  _id: Schema.Types.ObjectId;
  id: string;
  target?: {
    id: string;
    data?: T; // Virtual
  };
  targetPath: ITargetPath;
  url: string; // Virtual
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IImagePaginationResponse extends IPaginationResponse<IImage> {}
