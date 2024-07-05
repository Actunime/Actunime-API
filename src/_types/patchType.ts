import { ITargetPath } from '../_utils/global';
import { IPatchAction, IPatchStatus, IPatchType } from '../_utils/patchUtil';
import { Schema } from 'mongoose';
import { IPaginationResponse } from './paginationType';
import { IUser } from './userType';

export type IPatchActionList = {
  user: {
    id: string;
    data?: IUser; // virtual
  };
  note?: string;
  label: IPatchAction;
  at?: Date;
};

export interface IPatch<T = any> {
  _id: Schema.Types.ObjectId;
  id: string;
  type: IPatchType;
  actions: IPatchActionList[];
  status: IPatchStatus;
  target?: {
    id: string;
    data?: T; // Virtual
  };
  targetPath: ITargetPath;
  ref?: {
    id: string;
    data?: IPatch; // Virtual
  };
  changes?: T;
  beforeChanges?: T;
  author: {
    id: string;
    data?: IUser; // Virtual
  };

  createdAt?: Date;
  updatedAt?: Date;
}

export type IPatchPaginationResponse = IPaginationResponse<IPatch>;
