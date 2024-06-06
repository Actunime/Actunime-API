import { GroupeModel } from '../../../_models/_groupeModel';
import { Groupe_Pagination_ZOD } from '../../../_validation/groupeZOD';
import { FastifyRequest } from 'fastify';

export async function Get(req: FastifyRequest<{ Params: { id: string } }>) {
  const findGroupe = await GroupeModel.findOne({ id: req.params.id }).select('-_id');

  if (!findGroupe) {
    return new Response('Groupe not found', { status: 404 });
  }

  const paramWithMedia = new URL(req.url).searchParams.get('withMedia');
  const JSONWithMedia = JSON.parse(paramWithMedia || 'object');
  const data = Groupe_Pagination_ZOD.parse({ with: JSONWithMedia });

  if (data.with?.animes) await findGroupe.populate({ path: 'animes', select: '-_id' });

  if (data.with?.mangas) await findGroupe.populate({ path: 'mangas', select: '-_id' });

  return new Response(JSON.stringify(findGroupe.toJSON()), { status: 200 });
}
