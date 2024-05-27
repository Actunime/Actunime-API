import { ITargetPath } from "../_utils/global";
import { IUpdateAction, IUpdateStatus, IUpdateType } from "../_utils/updateUtil";
import { Schema } from "mongoose";
import { IPaginationResponse } from "./paginationType";
import { IUser } from "./userType";

export type IUpdateActionList = {
  user: {
    id: string;
    data?: IUser // virtual
  },
  note?: string,
  label: IUpdateAction
  at?: Date;
}

export interface IUpdate<T = any> {
  _id: Schema.Types.ObjectId;
  id: string;
  type: IUpdateType;
  actions: IUpdateActionList[];
  status: IUpdateStatus;
  target?: {
    id: string
    data?: T // Virtual
  };
  targetPath: ITargetPath;
  ref?: {
    id: string;
    data?: IUpdate; // Virtual
  }
  changes?: T;
  beforeChanges?: T;
  author: {
    id: string;
    data?: IUser; // Virtual
  };

  createdAt?: Date;
  updatedAt?: Date;
}


export type IUpdatePaginationResponse = IPaginationResponse<IUpdate>;
