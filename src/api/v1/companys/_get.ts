

import { CompanyModel } from "../../../_models/_companyModel";
import { FastifyRequest } from "fastify";


export async function Get(req: FastifyRequest<{ Params: { id: string } }>) {
    const findCompany = await CompanyModel.findOne({ id: req.params.id }).select('-_id');

    if (!findCompany) {
        return new Response("Company not found", { status: 404 });
    }

    return new Response(JSON.stringify(findCompany.toJSON()), { status: 200 });
}
