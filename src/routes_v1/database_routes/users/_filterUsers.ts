import { UserModel } from "@actunime/mongoose-models";
import { FastifyRequest } from "fastify";
import { FilterRouter } from "../../../_lib/interfaces";
import { UserDatabase_Pagination_ZOD } from "@actunime/validations";
import { MediaPagination } from "../../../_lib/pagination";

export const FilterUser = async (req: FastifyRequest<FilterRouter>) => {
    const paramPagination = JSON.parse(req.query.pagination || "{}");
    const paginationInput = UserDatabase_Pagination_ZOD.parse(paramPagination);
    const pagination = new MediaPagination({ model: UserModel, session: req.session });
    pagination.setPagination({
        page: paginationInput.page,
        limit: paginationInput.limit,
    });

    const query = paginationInput.query;
    if (query)
        pagination.addSearchQuery(query);
    const sort = paginationInput.sort;
    if (sort) pagination.setSort(sort);
    const response = await pagination.getResults(true);

    return response;
}