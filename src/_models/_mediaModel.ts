import { IMediaDate, IMediaLink, IMediaTitle } from "../_types/mediaType";
import { Schema } from "mongoose";

export const MediaTitleSchema = new Schema<IMediaTitle>({
  default: { type: String, required: true, unique: true, index: "text", trim: true },
  alias: [{ type: { content: String }, trim: true }],
}, { _id: false });

export const MediaDateSchema = new Schema<IMediaDate>({
  start: { type: Date },
  end: { type: Date },
}, { _id: false });

export const MediaImageSchema = new Schema({
  cover: { type: String },
  banner: { type: String },
}, { _id: false });

export const MediaLinkSchema = new Schema<IMediaLink>({
  name: { type: String, required: true, trim: true },
  value: { type: String, required: true, trim: true },
}, { _id: false });

export const withSchema = new Schema({
  id: { type: String, required: true },
}, { _id: false, toJSON: { virtuals: true } })