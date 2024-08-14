import { IUserRoles } from "../_utils/userUtil";
import { Schema } from "mongoose";
import { IPaginationResponse } from "./paginationType";
import { IImage } from "./imageType";

export interface IUserLinkedAccount {
  providerAccountId: string;
  provider: string;
  type: any;
}

export interface IUserAccountSession {
  sessionToken: string;
  accessToken: string;
  expires: Date;
  device: string;
  lastLogin: Date;
}

export interface IUserAccount {
  user: Schema.Types.ObjectId;
  email: string;
  linkedAccounts: IUserLinkedAccount[];
  sessions: IUserAccountSession[];
  verified: Date;
}

export interface IUser {
  _id: Schema.Types.ObjectId;
  id: string;

  username: string;
  displayName: string;
  bio?: string;
  roles: IUserRoles[];
  avatar?: {
    id: string;
    data?: IImage; // Virtual
  };
  banner?: {
    id: string;
    data?: IImage; // Virtual
  };
  disabled?: IUserDisabled // Virtual
  premium?: IUserPremium // Virtual

  createdAt: Date;
  updatedAt: Date;
}

export interface IUserPaginationResponse
  extends IPaginationResponse<IUser> { }

export interface IUserDisabled {
  id: string;
  reason: string;
  user: { id: string, data?: IUser };
  by: { id: string, data?: IUser };

  updatedAt: Date;
  createdAt: Date;
}
export interface IUserPremium {
  id: string;
  level: number;
  expires: Date;
  user: { id: string, data?: IUser };

  updatedAt: Date;
  createdAt: Date;
}
export interface IUserAuthToken {
  identifier: string;
  token: string;
  code: string;
  expires: Date;
  expireAt: Date;

  uses: number;
  signup: boolean;
  data: any;

  updatedAt: Date;
  createdAt: Date;
}
