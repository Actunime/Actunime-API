import { ReturnModelType } from "@typegoose/typegoose";
import { AnyParamConstructor } from "@typegoose/typegoose/lib/types";
import { FilterQuery } from "mongoose";
import { Pagination, PaginationOutputType } from "./_media.pagination";
import { fieldsProjection } from "graphql-fields-list";


export async function PaginationQuery<T extends AnyParamConstructor<any>, TModel extends ReturnModelType<T, any>>(options: {
    model: TModel,
    paginationQuery?: Pagination | null,
    filter: FilterQuery<TModel>,
    info?: any,
    customProjection?: any;
}): Promise<PaginationOutputType | null> {
    try {
        const start = Date.now()
        const { model, paginationQuery, filter, info, customProjection } = options;

        let { page, limit } = paginationQuery || { page: 1, limit: 20 };

        if (!page) page = 1;
        if (limit > 20 || !limit) limit = 20;

        const projection = info ?
            Object.fromEntries(
                Object.keys(
                    Object.assign(fieldsProjection(info), { pubId: 1 })
                ).map(key => [key.replace('results', 'data'), 1])) : {};

        const projectionKeys = Object.keys(projection);
        let pathToPopulate = '';

        if (projectionKeys.find(k => k.startsWith("data.groupe.data"))) {
            pathToPopulate += " data.groupe.vData"
            Object.assign(projection, { 'data.groupe.pubId': 1 })
        }

        if (projectionKeys.find(k => k.startsWith("data.parent.data"))) {
            pathToPopulate += " data.parent.vData"
            Object.assign(projection, { 'data.parent.pubId': 1 })
        }

        if (projectionKeys.find(k => k.startsWith("data.companys.data"))) {
            pathToPopulate += " data.companys.vData"
            Object.assign(projection, { 'data.companys.pubId': 1 })
        }

        if (projectionKeys.find(k => k.startsWith("data.characters.data"))) {
            pathToPopulate += " data.characters.vData"
            Object.assign(projection, { 'data.characters.pubId': 1 })
        }

        if (projectionKeys.find(k => k.startsWith("data.staffs.data"))) {
            pathToPopulate += " data.staffs.vData"
            Object.assign(projection, { 'data.staffs.pubId': 1 })
        }

        if (projectionKeys.find(k => k.startsWith("data.tracks.data"))) {
            pathToPopulate += " data.tracks.vData"
            Object.assign(projection, { 'data.tracks.pubId': 1 })
        }

        let skip = limit * (page - 1);
        const dbResponse = await model.aggregate([
            {
                $project: {
                    ...(projection || {}),
                    ...customProjection,
                    pubId: 1,
                    createdAt: 1
                }
            },
            { $match: filter },
            {
                $facet: {
                    total: [{
                        $count: 'createdAt'
                    }],
                    data: [{
                        $addFields: {
                            _id: '$_id'
                        }
                    }],
                },
            },
            {
                $unwind: '$total'
            },
            {
                $project: {
                    pubId: '$pubId',
                    data: {
                        $slice: ['$data', skip, { $ifNull: [limit, '$total.createdAt'] }]
                    },
                    meta: {
                        totalResults: '$total.createdAt',
                        limitPerPage: {
                            $literal: limit
                        },
                        currentPage: {
                            $literal: ((skip / limit) + 1)
                        },
                        totalPage: {
                            $ceil: {
                                $divide: ['$total.createdAt', limit]
                            }
                        },
                    },
                },
            }
        ]).exec()

        if (!Array.isArray(dbResponse) || !dbResponse.length) return {
            currentPage: page,
            totalPage: 1,
            limitPerPage: limit,
            totalResults: 0,
            hasNextPage: false,
            hasPrevPage: false,
            results: [],
            ms: Date.now() - start
        };

        const [result] = dbResponse;

        let results = result.data;
        let pageInfo = result.meta

        if (pathToPopulate) await model.populate(results, { path: pathToPopulate })

        return {
            ...pageInfo,
            hasNextPage: page < pageInfo.totalPage,
            hasPrevPage: page === pageInfo.totalPage || page < pageInfo.totalPage && page > 1,
            results: results.map((x: any) => ({ id: x.pubId, ...x.data })),
            ms: Date.now() - start
        }

    } catch (err) {
        console.error(err);
        return null;
    }
}