import { FastifyReply, FastifyRequest } from 'fastify';
import mongoose from 'mongoose';
import { PatchManager } from '@/_lib/patch';
import { FilterRouter, GetRouter } from '@/_lib/interfaces';
import { Patch_Pagination_ZOD } from '@/_validation/patchZOD';

export const GetPatchRouter = async (req: FastifyRequest<GetRouter>, res: FastifyReply) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const paramWithMedia = req.query.withMedia;
    const JSONWithMedia = JSON.parse(paramWithMedia || 'object');
    const patch = await new PatchManager(session, req.user).get(req.params.id, JSONWithMedia);

    await session.commitTransaction();
    await session.endSession();

    return patch;
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    res.code(400).send();
  }
};

export const FilterPatchRouter = async (req: FastifyRequest<FilterRouter>, res: FastifyReply) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const paramPagination = JSON.parse(req.query.pagination || '{}');
    const data = Patch_Pagination_ZOD.parse(paramPagination);
    const patch = await new PatchManager(session, req.user).filter(data);

    await session.commitTransaction();
    await session.endSession();

    return patch;
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    res.code(400).send();
  }
};
