

import { TrackModel } from "../../../_models/_trackModel";
import { FastifyRequest } from "fastify";




export async function Get(req: FastifyRequest<{ Params: { id: string } }>) {
    const findTrack = await TrackModel.findOne({ id: req.params.id }).select('-_id');

    if (!findTrack) {
        return new Response("Track not found", { status: 404 });
    }

    return new Response(JSON.stringify(findTrack.toJSON()), { status: 200 });
}