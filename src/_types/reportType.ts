import { ITargetPath } from "../_utils/global";
import { IReportStatus, IReportSubject } from "../_utils/reportUtil";
import { Schema } from "mongoose";
import { IPaginationResponse } from "./paginationType";
import { IUser } from "./userType";

export interface IReport {
  _id: Schema.Types.ObjectId;
  id: string;
  status: IReportStatus;
  by?: {
    id: string,
    data?: IUser // Virtual
  };
  target: {
    id: string,
    data?: any // Virtual
  };
  targetPath: ITargetPath;
  subject: string | IReportSubject;
  message: string;
  author: {
    id: string,
    data?: IUser // Virtual
  };

  updatedAt: Date;
  createdAt: Date;
}

export interface IReportPopulated extends IReport {
  author: IUser;
  by: IUser;
}

export interface IReportCreateProps
  extends Omit<IReport, "id" | "_id" | "status" | "createdAt" | "updatedAt"> {
  subject: string;
}

export type IReportPaginationResponse = IPaginationResponse<IReportPopulated>;
