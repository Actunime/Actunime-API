import { AnimeSaveDB } from '../../../_server-utils/anime';
import { ErrorHandled } from '../../../_server-utils/errorHandling';
import { Create_Anime_ZOD, ICreate_Anime_ZOD } from '../../../_validation/animeZOD';
import { FastifyRequest } from 'fastify';

export async function Create(req: FastifyRequest<{ Body: ICreate_Anime_ZOD }>) {
  const user = req.user;

  if (!user) throw new Error('user est requis mettre une restriction dans le index.ts du dossier');

  let data: ICreate_Anime_ZOD;

  try {
    data = await req.body;
    data = Create_Anime_ZOD.parse(data);
  } catch (error: any) {
    return new Response('Bad request', { status: 400 });
  }

  try {
    const init = await AnimeSaveDB(data, user);
    await init.create();
  } catch (error: any) {
    console.error('erreur', error.message);

    if (error instanceof ErrorHandled) {
      return new Response(JSON.stringify({ error: error.message }), { status: 502 });
    }

    return new Response('Server error', { status: 502 });
  }
}
