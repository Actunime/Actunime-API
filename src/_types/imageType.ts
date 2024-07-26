import { Schema } from 'mongoose';
import { IPaginationResponse } from './paginationType';

export interface IImage {
  _id: Schema.Types.ObjectId;
  id: string;
  url: string; // Virtual
  location: string; // Virtual;
  targetPath: string;
  isVerified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IImagePaginationResponse extends IPaginationResponse<IImage> { }
