import { model, Schema } from "mongoose"
import { TrackClassProps } from "./Track.class"
import { TrackRequestClassProps } from "./TrackRequest.class";
import { AutoIncrementIds } from "../../lib/mongoosePlugin";


export const TrackRequestSchema = new Schema<TrackRequestClassProps>({
    id: Number,
});

TrackRequestSchema.plugin(AutoIncrementIds.bind(null, 'trackRequest'));

export const TrackRequestModel = model('trackRequest', TrackRequestSchema, 'trackRequests');