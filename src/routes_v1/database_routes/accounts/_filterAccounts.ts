import { AccountModel, UserModel } from "@actunime/mongoose-models";
import { FastifyRequest } from "fastify";
import { FilterRouter } from "../../../_lib/interfaces";
import { AccountDatabase_Pagination_ZOD } from "@actunime/validations";
import { MediaPagination } from "../../../_lib/pagination";
import { IAccount } from "@actunime/types";


export const FilterAccount = async (req: FastifyRequest<FilterRouter>) => {
    const paramPagination = JSON.parse(req.query.pagination || "{}");
    const paginationInput = AccountDatabase_Pagination_ZOD.parse(paramPagination);
    const pagination = new MediaPagination({ model: AccountModel, session: req.session });
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

    const verifyUser = async (userId: string) => {
        const findUser = await UserModel.findOne({ id: userId }, null, { session: req.session });
        return !!findUser;
    }

    response.results = await Promise.all(response.results.map(async r => {
        return {
            ...r,
            email: r.email.slice(0, 3) + "***" + r.email.split("@")[1],
            userId: await verifyUser(r.userId) ? r.userId : null,
        } as IAccount
    }))

    return response;
}