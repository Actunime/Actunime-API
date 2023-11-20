import { model, Schema } from "mongoose"
import { CompanyRequestClassProps } from "./CompanyRequest.class";
import { AutoIncrementIds } from "../../lib/mongoosePlugin";
// import { AnimeRequestClass } from "./AnimeRequest.class";




// export const CompanySchema = new Schema<CompanyClassProps>();
// export const CompanyModel = model('company', CompanySchema, 'companys');

const CompanyRequestSchema = new Schema<CompanyRequestClassProps>({
    id: { type: Number, required: false },
    label: String,
    name: String,
    siteUrl: String,
    // createdDate: Date
});

CompanyRequestSchema.plugin(AutoIncrementIds.bind(null, 'companyRequest'))

const CompanyRequestModel = model('companyRequest', CompanyRequestSchema, 'companyRequests');


export { CompanyRequestSchema, CompanyRequestModel }