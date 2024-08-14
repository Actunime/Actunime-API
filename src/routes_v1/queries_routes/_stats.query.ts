import { ITargetPath, TargetPathArray } from '@/_utils/global';
import { FastifyReply, FastifyRequest } from 'fastify';
import mongoose from 'mongoose';

export const GetStatsRouter = async (req: FastifyRequest, res: FastifyReply) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const connection = mongoose.connection;
    const collections = await connection.db?.listCollections().toArray();

    if (!collections) return res.send('Collections not found').status(404);

    const dateMonth = new Date();
    dateMonth.setMonth(dateMonth.getMonth() ? dateMonth.getMonth() - 1 : 11);

    const colsCount = await Promise.all(
      collections.map(async (col) => {
        const collection = connection.db?.collection(col.name);

        if (!collection) return [col.name, { count: 0, mounth: 0 }];

        const count = await collection.countDocuments();
        const mounth = await collection.countDocuments({ createdAt: { $gte: dateMonth } });

        let colName = col.name.replace('ies', 'y');

        if (colName.endsWith('s')) colName = colName.slice(0, -1);

        const findPath = TargetPathArray.find((path) => colName === path.toLocaleLowerCase()); // -1 pour enlever le 'y' mongoose remplace y par "ies"

        if (!findPath) return [colName, { count, mounth }];

        return [findPath, { count, mounth }];
      })
    );

    const objCount = Object.fromEntries(colsCount);

    await session.commitTransaction();
    await session.endSession();

    return objCount;
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    res.code(400).send();
  }
};

function humanizePath(path: ITargetPath | string) {
  path = path.toLowerCase().replace('y', 'ie');
  if (!path.endsWith('s')) path = path + 's';

  return path;
}

export const GetStatsByPathRouter = async (
  req: FastifyRequest<{ Params: { path: ITargetPath } }>,
  res: FastifyReply
) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

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
      return res.send('Path not found').status(404);

    const col = mongoose.connection?.db?.collection(paramsPath);
    if (!col) return res.send('Col not found').status(404);

    const response = {
      // mediaTendanceActivity,
      count: await col.countDocuments(),
      mounth: await col.countDocuments({
        createdAt: {
          $gte: new Date().setMonth(new Date().getMonth() ? new Date().getMonth() - 1 : 11)
        }
      })
    };

    await session.commitTransaction();
    await session.endSession();

    return response;
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    res.code(400).send();
  }
};
