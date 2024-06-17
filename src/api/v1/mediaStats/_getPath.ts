import { ITargetPath } from '../../../_utils/global';
import { FastifyRequest } from 'fastify';
import mongoose from 'mongoose';

function humanizePath(path: ITargetPath | string) {
  path = path.toLowerCase().replace('y', 'ie');
  if (!path.endsWith('s')) path = path + 's';

  return path;
}

export async function GetPath(req: FastifyRequest<{ Params: { path: ITargetPath } }>) {
  const paramsPath = humanizePath(req.params.path);
  const authorizedPath: ITargetPath[] = [
    'Anime',
    'Character',
    'Company',
    'Manga',
    'Person',
    'Track',
    'User'
  ];

  if (!authorizedPath.find((path) => humanizePath(path) === paramsPath))
    return new Response('Path not found', { status: 404 });

  const col = mongoose.connection.db.collection(paramsPath);
  console.log('aaaa', paramsPath, col.collectionName);
  if (!col) return new Response('Col not found', { status: 404 });

  // let findPathActivity = await ActivityModel.find({ targetPath: paramsPath }) || [];
  // const pathIds = findPathActivity.map((activity) => activity.target.id);

  // const mediaTendanceActivity: {
  //     id: string,
  //     count: number
  // }[] = []

  // for (const pathID of pathIds) {

  //     const activity24h = await ActivityModel
  //         .find({
  //             "target.id": pathID,
  //             "createdAt": {
  //                 $gte: new Date().setHours(new Date().getHours() - 24)
  //             },
  //             "action": {
  //                 $in: []
  //             }
  //         })
  //         .populate("target.data")
  //         .lean();

  //     mediaTendanceActivity.push({
  //         id: pathID,
  //         count: activity24h.length,

  //     })
  // }

  const response = {
    // mediaTendanceActivity,
    count: await col.countDocuments(),
    mounth: await col.countDocuments({
      createdAt: {
        $gte: new Date().setMonth(new Date().getMonth() ? new Date().getMonth() - 1 : 11)
      }
    })
  };

  return Response.json(response, { status: 200 });
}
