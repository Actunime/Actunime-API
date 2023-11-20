import { model } from "mongoose";
import { CompanySchema } from "./_Company.schemas";



export const CompanyModel = model('companyRequest', CompanySchema, 'companyRequests');
