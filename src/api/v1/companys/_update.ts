import { CompanySaveDB } from '../../../_server-utils/company';
import { ErrorHandled } from '../../../_server-utils/errorHandling';
import { Create_Company_ZOD, ICreate_Company_ZOD } from '../../../_validation/companyZOD';
import { FastifyRequest } from 'fastify';

export async function Update(
  req: FastifyRequest<{ Params: { id: string }; Body: ICreate_Company_ZOD }>
) {
  const user = req.user;

  if (!user) throw new Error('user est requis mettre une restriction dans le index.ts du dossier');

  let data;
  let parsedZOD;

  try {
    data = req.body;
    parsedZOD = Create_Company_ZOD.parse(data);
  } catch (error: any) {
    return new Response('Bad request', { status: 400 });
  }

  try {
    const init = await CompanySaveDB(parsedZOD, user);

    await init.update(req.params.id);

    return Response.json({ id: req.params.id }, { status: 200 });
  } catch (error: any) {
    console.error('erreur', error.message);

    if (error instanceof ErrorHandled) {
      return new Response(JSON.stringify({ error: error.message }), { status: 502 });
    }
    return new Response('Server error', { status: 502 });
  }
}
