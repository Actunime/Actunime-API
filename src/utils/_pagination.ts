import { ReturnModelType } from "@typegoose/typegoose";
import { AnyParamConstructor } from "@typegoose/typegoose/lib/types";
import { FilterQuery } from "mongoose";
import { Pagination, PaginationMediaType } from "./_media.pagination";
import { fieldsProjection } from "graphql-fields-list";


export async function PaginationQuery<T extends AnyParamConstructor<any>, TModel extends ReturnModelType<T, any>>(options: {
    model: TModel,
    paginationQuery?: Pagination | null,
    filter: FilterQuery<TModel>,
    info?: any,
    customProjection?: any;
}): Promise<PaginationMediaType | null> {
    try {
        const start = Date.now()
        const { model, paginationQuery, filter, info, customProjection } = options;

        let { page, limit } = paginationQuery || { page: 1, limit: 20 };

        if (!page) page = 1;
        if (limit > 20 || !limit) limit = 20;

        const projection = info ?
            Object.fromEntries(
                Object.keys(
                    Object.assign(fieldsProjection(info), { id: 1 })
                ).filter(key => key.startsWith('results.')).map(key => [key.replace('results.', ''), 1])) : {};

        const projectionKeys = Object.keys(projection);
        console.log(projectionKeys);

        let pathToPopulate: { path: string, populate?: { path: string, foreignField: string, model: string } }[] = [];

        // if (projectionKeys.find(k => k.startsWith("data.groupe.data"))) {
        //     pathToPopulate += " data.groupe.vData"
        //     Object.assign(projection, { 'data.groupe.id': 1 })
        // }

        // if (projectionKeys.find(k => k.startsWith("data.parent.data"))) {
        //     pathToPopulate += " data.parent.vData"
        //     Object.assign(projection, { 'data.parent.id': 1 })
        // }

        if (projectionKeys.find(k => k.startsWith("data.companys.company"))) {
            pathToPopulate.push({ path: 'data.companys.company' })
            Object.assign(projection, { 'data.companys.id': 1 })
        }

        if (projectionKeys.find(k => k.startsWith("data.characters.character"))) {
            const withActors = projectionKeys.find(k => k.startsWith("data.characters.character.data.actors.person"));
            pathToPopulate.push({ path: 'data.characters.character', ...withActors && { populate: { path: 'data.actors.person', foreignField: 'id', model: 'Person' } } })
            Object.assign(projection, { 'data.characters.id': 1 })
        }


        if (projectionKeys.find(k => k.startsWith("data.staffs.person"))) {
            pathToPopulate.push({ path: 'data.staffs.person' })
            Object.assign(projection, { 'data.staffs.id': 1 })
        }

        if (projectionKeys.find(k => k.startsWith("data.tracks.track"))) {
            const withActors = projectionKeys.find(k => k.startsWith("data.tracks.track.data.artists.person"));
            pathToPopulate.push({ path: 'data.tracks.track', ...withActors && { populate: { path: 'data.artists.person', foreignField: 'id', model: 'Person' } } })
            Object.assign(projection, { 'data.tracks.id': 1 })
        }


        // characters projection

        if (projectionKeys.find(k => k.startsWith("data.actors.person"))) {
            pathToPopulate.push({ path: 'data.actors.person' })
            Object.assign(projection, { 'data.actors.id': 1 })
        }

        // Tracks projection

        if (projectionKeys.find(k => k.startsWith("data.tracks.person"))) {
            pathToPopulate.push({ path: 'data.tracks.person' })
            Object.assign(projection, { 'data.tracks.id': 1 })
        }

        if (projectionKeys.find(k => k.startsWith("data.artists.person"))) {
            pathToPopulate.push({ path: 'data.artists.person' })
            Object.assign(projection, { 'data.artists.id': 1 })
        }


        const projections = {
            ...projection,
            ...customProjection
        }

        let skip = limit * (page > 0 ? page - 1 : page);

        const dbResponse = await model.aggregate([
            { $match: filter },
            {
                $facet: {
                    total: [{ $count: 'createdAt' }],
                    results: [{ $project: projections }],
                }
            },
            { $unwind: '$total' },
            {
                $project: {
                    page: { $literal: (skip / limit) + 1 },
                    pageCount: { $ceil: { $divide: ['$total.createdAt', limit] } },
                    pageResultsCount: { $size: { $slice: ['$results', skip, { $ifNull: [limit, '$total.createdAt'] }] } },
                    hasNextPage: { $lt: [{ $literal: (skip / limit) + 1 }, { $ceil: { $divide: ['$total.createdAt', limit] } }] },
                    hasPrevPage: { $gt: [{ $literal: (skip / limit) + 1 }, 1] },
                    results: { $slice: ['$results', skip, { $ifNull: [limit, '$total.createdAt'] }] },
                    resultsLimit: { $literal: limit },
                    resultsCount: '$total.createdAt',
                }
            },
        ]).exec() as [PaginationMediaType]

        if (!Array.isArray(dbResponse) || !dbResponse.length) return {
            page: page,
            pageCount: 1,
            pageResultsCount: 0,
            hasNextPage: false,
            hasPrevPage: false,
            results: [],
            resultsLimit: limit,
            resultsCount: 0,
            ms: Date.now() - start
        };

        const [result] = dbResponse;

        console.log('pathToPopulate', pathToPopulate, result)
        if (pathToPopulate) {
            for await (const path of pathToPopulate) {
                await model.populate(result.results, { ...path, options: { lean: true } });
            }
        }

        return {
            ...result,
            ms: Date.now() - start
        }

    } catch (err) {
        console.error(err);
        return null;
    }
}



export async function UserPaginationQuery<T extends AnyParamConstructor<any>, TModel extends ReturnModelType<T, any>>(options: {
    model: TModel,
    paginationQuery?: Pagination | null,
    filter: FilterQuery<TModel>,
    info?: any,
    customProjection?: any;
}): Promise<PaginationMediaType | null> {
    try {
        const start = Date.now()
        const { model, paginationQuery, filter, info, customProjection } = options;

        let { page, limit } = paginationQuery || { page: 1, limit: 20 };

        if (!page) page = 1;
        if (limit > 20 || !limit) limit = 20;

        const projection = info ?
            Object.fromEntries(
                Object.keys(
                    Object.assign(fieldsProjection(info), { id: 1 })
                ).filter(key => key.startsWith('results.')).map(key => [key.replace('results.', ''), 1])) : {};

        console.log("USER PROJECTION", projection);

        // const projectionKeys = Object.keys(projection);
        let pathToPopulate = '';
        //Populate exemple
        // if (projectionKeys.find(k => k.startsWith("data.groupe.data"))) {
        //     pathToPopulate += " data.groupe.vData"
        //     Object.assign(projection, { 'data.groupe.id': 1 })
        // }

        const projections = {
            ...projection,
            ...customProjection
        }

        let skip = limit * (page - 1);
        const dbResponse = await model.aggregate([
            { $match: filter },
            {
                $facet: {
                    total: [{ $count: 'createdAt' }],
                    results: [{ $project: projections }],
                }
            },
            { $unwind: '$total' },
            {
                $project: {
                    page: { $literal: (skip / limit) + 1 },
                    pageCount: { $ceil: { $divide: ['$total.createdAt', limit] } },
                    pageResultsCount: { $size: { $slice: ['$results', skip, { $ifNull: [limit, '$total.createdAt'] }] } },
                    hasNextPage: { $lt: [{ $literal: (skip / limit) + 1 }, { $ceil: { $divide: ['$total.createdAt', limit] } }] },
                    hasPrevPage: { $gt: [{ $literal: (skip / limit) + 1 }, 1] },
                    results: { $slice: ['$results', skip, { $ifNull: [limit, '$total.createdAt'] }] },
                    resultsLimit: { $literal: limit },
                    resultsCount: '$total.createdAt',
                }
            },
        ]).exec() as [PaginationMediaType]

        if (!Array.isArray(dbResponse) || !dbResponse.length) return {
            page: page,
            pageCount: 1,
            pageResultsCount: 0,
            hasNextPage: false,
            hasPrevPage: false,
            results: [],
            resultsLimit: limit,
            resultsCount: 0,
            ms: Date.now() - start
        };

        const [result] = dbResponse;


        if (pathToPopulate) {
            await model.populate(result.results, { path: pathToPopulate })
        }

        return {
            ...result,
            ms: Date.now() - start
        }

    } catch (err) {
        console.error(err);
        return null;
    }
}