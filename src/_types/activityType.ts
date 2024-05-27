import { IActivityAction, IActivityType } from "../_utils/activityUtil";
import { Schema } from "mongoose";
import { IPaginationResponse } from "./paginationType";
import { IUser } from "./userType";

export interface IActivity {
  _id: Schema.Types.ObjectId;
  id: string;
  type: IActivityType;
  action: IActivityAction;
  author?: {
    id: string;
    data?: IUser; // Virtual
  }
  target?: {
    id: string;
    data?: any; // Virtual
  };
  targetPath: string;
  changes?: { before: any; after: any };
  params?: any;

  updatedAt?: Date;
  createdAt: Date;
}

// export interface IActivityPopulated extends IActivity {
//   author?: IUser | null;
// }

export type IActivityPaginationResponse =
  IPaginationResponse<IActivity>;

export type IActivityCreateProps = Omit<
  IActivity,
  "id" | "_id" | "createdAt" | "updatedAt"
>;
