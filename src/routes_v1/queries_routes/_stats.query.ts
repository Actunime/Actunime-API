import { ITargetPath, TargetPathArray } from "@actunime/types";
import { FastifyRequest } from "fastify";
import mongoose from "mongoose";
import { APIError } from "../../_lib/Error";

export const GetStatsRouter = async () => {
  const connection = mongoose.connection;
  const collections = await connection.db?.listCollections().toArray();

  if (!collections)
    throw new APIError("Hmm collections ?", "NOT_FOUND");

  const dateMonth = new Date();
  dateMonth.setMonth(dateMonth.getMonth() ? dateMonth.getMonth() - 1 : 11);

  const colsCount = await Promise.all(
    collections.map(async (col) => {
      const collection = connection.db?.collection(col.name);

      if (!collection) return [col.name, { count: 0, mounth: 0 }];

      const count = await collection.countDocuments();
      const mounth = await collection.countDocuments({
        createdAt: { $gte: dateMonth },
      });

      let colName = col.name.replace("ies", "y");

      if (colName.endsWith("s")) colName = colName.slice(0, -1);

      const findPath = TargetPathArray.find(
        (path) => colName === path.toLocaleLowerCase(),
      ); // -1 pour enlever le 'y' mongoose remplace y par "ies"

      if (!findPath) return [colName, { count, mounth }];

      return [findPath, { count, mounth }];
    }),
  );

  const objCount = Object.fromEntries(colsCount);

  return objCount;
};

function humanizePath(path: ITargetPath | string) {
  path = path.toLowerCase().replace("y", "ie");
  if (!path.endsWith("s")) path = path + "s";

  return path;
}

export const GetStatsByPathRouter = async (
  req: FastifyRequest<{ Params: { path: ITargetPath } }>,
) => {
  const paramsPath = humanizePath(req.params.path);
  const authorizedPath: ITargetPath[] = [
    "Anime",
    "Character",
    "Company",
    "Manga",
    "Person",
    "Track",
    "User",
  ];

  if (!authorizedPath.find((path) => humanizePath(path) === paramsPath))
    throw new APIError("Path not found", "NOT_FOUND");

  const col = mongoose.connection?.db?.collection(paramsPath);
  if (!col) throw new APIError("Col not found", "NOT_FOUND");

  const response = {
    // mediaTendanceActivity,
    count: await col.countDocuments(),
    mounth: await col.countDocuments({
      createdAt: {
        $gte: new Date().setMonth(
          new Date().getMonth() ? new Date().getMonth() - 1 : 11,
        ),
      },
    }),
  };

  return response;
};
