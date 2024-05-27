

import { UpdateModel } from "../../../_models";
import { Update_Pagination_ZOD } from "../../../_validation/updateZOD";
import { FastifyRequest } from "fastify";




export async function Get(req: FastifyRequest<{ Params: { id: string } }>) {
    const findUpdate = await UpdateModel.findOne({ id: req.params.id }).select('-_id');

    if (!findUpdate) {
        return new Response("Update not found", { status: 404 });
    }

    const paramWithMedia = new URL(req.url).searchParams.get('withMedia');
    const JSONWithMedia = JSON.parse(paramWithMedia || '{}');
    const data = Update_Pagination_ZOD.parse({ with: JSONWithMedia });


    if (data.with?.author)
        await findUpdate.populate({ path: "author.data" });

    if (data.with?.target)
        await findUpdate.populate({ path: "target.data" });

    if (data.with?.ref)
        await findUpdate.populate({ path: "ref.data" });

    if (data.with?.actions)
        await findUpdate.populate({ path: "actions.user.data" });

    return new Response(JSON.stringify(findUpdate.toJSON()), { status: 200 });
}