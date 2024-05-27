import { ITrack } from "../_types/trackType";
import { genPublicID } from "../_utils/genID";
import { TrackTypeArray } from "../_utils/trackUtil";
import { Model, Schema, model, models } from "mongoose";
import { MediaLinkSchema } from "./_mediaModel";
import { withPersonSchema } from "./_personModel";

const TrackSchema = new Schema<ITrack>(
  {
    id: { type: String, default: () => genPublicID(5) },
    isVerified: { type: Boolean, default: false },
    isPreAdded: { type: Boolean, default: false },
    type: {
      type: String,
      enum: TrackTypeArray,
      required: true,
    },
    name: { type: { default: { type: String, required: true }, native: String }, required: true },
    pubDate: { type: Date, default: undefined },
    image: { type: String, default: undefined },
    artists: { type: [withPersonSchema], default: [] },
    links: { type: [MediaLinkSchema], default: [] },
  },
  { timestamps: true, id: false }
);

TrackSchema.virtual('artists.data', {
  ref: 'Person',
  localField: 'artists.id',
  foreignField: 'id',
  justOne: true
})

export const withTrackSchema = new Schema({
  id: { type: String, required: true },
}, { _id: false, toJSON: { virtuals: true } })


export const TrackModel = model("Track", TrackSchema);
