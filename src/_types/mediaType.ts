import { Schema } from "mongoose";

export interface IMediaBase {
  _id: Schema.Types.ObjectId;
  id: string;
  isVerified: boolean;
  isPreAdded: boolean;
  updatedAt: Date | string;
  createdAt: Date | string;
}

export interface IMediaTitle {
  default: string;
  alias?: { content: string }[];
}

export interface IMediaDate {
  start?: Date;
  end?: Date;
}

export interface IMediaImage {
  cover?: string;
  banner?: string;
}

export interface IMediaLink {
  name: string;
  value: string;
}


export type IMediaDisplayVariant = "LIST" | "CARD" | "DEFAULT";
