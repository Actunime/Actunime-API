import { model } from "mongoose";
import { TrackSchema, TrackSchemaV2 } from "./_Track.schemas";




export const TrackModel = model('trackRequest', TrackSchemaV2, 'trackRequests');