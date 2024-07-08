import { ITargetPath } from '../_utils/global';
import { IPatchStatus, IPatchType } from '../_utils/patchUtil';
import { Schema } from 'mongoose';
import { IPaginationResponse } from './paginationType';
import { IUser } from './userType';

export interface IPatch<T = any> {
  _id: Schema.Types.ObjectId;
  id: string;
  type: IPatchType;
  note: string;
  status: IPatchStatus;
  target?: { id: string; data?: T; };
  targetPath: ITargetPath;
  ref?: { id: string; data?: IPatch; };
  newValues?: T;
  oldValues?: T;
  author: { id: string; data?: IUser; };
  currentModerator: { id: string; at: Date; data?: IUser; };
  createdAt?: Date;
  updatedAt?: Date;
}

export type IPatchPaginationResponse = IPaginationResponse<IPatch>;
