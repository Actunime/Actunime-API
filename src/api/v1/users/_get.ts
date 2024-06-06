import { UserModel } from '../../../_models/_userModel';
import { FastifyRequest } from 'fastify';
export async function Get(req: FastifyRequest<{ Params: { id: string } }>) {
  const findUser = await UserModel.findOne({ id: req.params.id }).select('-_id');

  if (!findUser) {
    return new Response('User not found', { status: 404 });
  }

  // const paramWithMedia = new URL(req.url).searchParams.get('withMedia');
  // const JSONWithMedia = JSON.parse(paramWithMedia || 'object');
  // const data = User_Pagination_ZOD.parse({ with: JSONWithMedia });

  // await findUser.populate({ path: 'disabled', select: '-_id' })
  // await findUser.populate({ path: 'premium', select: '-_id' });

  return new Response(JSON.stringify(findUser.toJSON()), { status: 200 });
}
