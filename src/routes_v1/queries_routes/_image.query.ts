import { FastifyReply, FastifyRequest } from 'fastify';
import mongoose from 'mongoose';
import { ImageManager } from '@/_lib/image';
import { FilterRouter, GetRouter } from '@/_lib/interfaces';
import { Image_Pagination_ZOD } from '@/_validation/imageZOD';

export const GetImageRouter = async (req: FastifyRequest<GetRouter>, res: FastifyReply) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const paramWithMedia = req.query.withMedia;
        const JSONWithMedia = JSON.parse(paramWithMedia || '{}');
        const image = await new ImageManager(session).get(req.params.id, JSONWithMedia);

        await session.commitTransaction();
        await session.endSession();

        return image;
    } catch (err) {
        console.log(err);
        await session.abortTransaction();
        res.code(400).send();
    }
};

export const FilterImageRouter = async (req: FastifyRequest<FilterRouter>, res: FastifyReply) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const paramPagination = JSON.parse(req.query.pagination || '{}');
        const data = Image_Pagination_ZOD.parse(paramPagination);
        const image = await new ImageManager(session).filter(data);

        await session.commitTransaction();
        await session.endSession();

        return image;
    } catch (err) {
        console.log(err);
        await session.abortTransaction();
        res.code(400).send();
    }
};
