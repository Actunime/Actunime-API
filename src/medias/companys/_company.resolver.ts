import { Resolver } from "type-graphql";
import { Company } from "./_company.type";




@Resolver(Company)
export class CompanyResolver {
    async getCompany() { }
    async searchCompany() { }

    async getFullCompany() { }
    async searchFullCompany() { }

    async addCompany() { }
    async addCompanyUpdate() { }
    async editCompanyUpdate() { }

    async addCompanyRequest() { }
    async addAnimeUpdateRequest() { }
    async editCompanyUpdateRequest() { }
}