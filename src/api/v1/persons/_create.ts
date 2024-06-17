import { PersonSaveDB } from '../../../_server-utils/person';
import { ErrorHandled } from '../../../_server-utils/errorHandling';
import { Create_Person_ZOD, ICreate_Person_ZOD } from '../../../_validation/personZOD';
import { FastifyRequest } from 'fastify';

export async function Create(req: FastifyRequest<{ Body: ICreate_Person_ZOD }>) {
  const user = req.user;
  if (!user) return;

  let data: ICreate_Person_ZOD;

  try {
    data = await req.body;
    data = Create_Person_ZOD.parse(data);
  } catch (error: any) {
    return new Response('Bad request', { status: 400 });
  }

  try {
    const init = await PersonSaveDB(data, user);
    await init.create();
  } catch (error: any) {
    console.error('erreur', error.message);

    if (error instanceof ErrorHandled) {
      return new Response(JSON.stringify({ error: error.message }), { status: 502 });
    }

    return new Response('Server error', { status: 502 });
  }
}
