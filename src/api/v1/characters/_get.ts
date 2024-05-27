

import { CharacterModel } from "../../../_models/_characterModel";
import { Character_Pagination_ZOD } from "../../../_validation/characterZOD";
import { FastifyRequest } from "fastify";




export async function Get(req: FastifyRequest<{ Params: { id: string } }>) {
    const findCharacter = await CharacterModel.findOne({ id: req.params.id }).select('-_id');

    if (!findCharacter) {
        return new Response("Character not found", { status: 404 });
    }

    const paramWithMedia = new URL(req.url).searchParams.get('withMedia');
    const JSONWithMedia = JSON.parse(paramWithMedia || '{}');

    const data = Character_Pagination_ZOD.parse({ with: JSONWithMedia });

    if (data.with?.actors)
        await findCharacter.populate({ path: 'actors.data', select: '-_id' });

    return new Response(JSON.stringify(findCharacter.toJSON()), { status: 200 });
}