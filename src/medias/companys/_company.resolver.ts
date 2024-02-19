import { Arg, Authorized, Info, Mutation, Query, Resolver } from "type-graphql";
import { MediaSearchLogic, Pagination } from "../../utils";
import { CompanyMedia, CompanyModel, CompanyPaginationOutput } from "./_company.model";
import { Company, CompanySearchQuery } from "./_company.type";
import { fieldsProjection } from 'graphql-fields-list'
import { PaginationQuery } from "../../utils/_pagination";
import { CompanyInput } from "./_company.input";
import { IUserRoles } from "../users/_user.type";


@Resolver(Company)
export class CompanyResolver {

    @Query(_return => Company, { nullable: true })
    async getCompany(@Arg("id", () => String) id: string, @Info() info: any) {

        const projection = info ?
            Object.fromEntries(
                Object.keys(
                    Object.assign(fieldsProjection(info), { id: 1 })
                ).map(key => [key.replace(key, 'data.' + key), 1])) : {};

        console.log(projection)

        const findCompany = await CompanyModel.findOne({ id }, { id: 1, ...projection }).lean();

        console.log('getCompany', findCompany);
        // TODO: check le statut (public ou non etc...)
        if (findCompany && findCompany.data) {

            console.log("CA RETOURNE")
            const { id, data } = findCompany;

            return data;

        } else {
            return null;
        }

    }

    @Query(_returns => CompanyPaginationOutput, { nullable: true })
    async searchCompanys(

        @Arg("pagination", () => Pagination, { nullable: true })
        pagination: Pagination | null,

        @Arg("searchQuery", () => CompanySearchQuery, { nullable: true })
        searchQuery: CompanySearchQuery | null,

        @Arg("searchLogic", () => MediaSearchLogic, { nullable: true, defaultValue: 'OR' })
        searchLogic: MediaSearchLogic,

        @Info()
        info: any

    ): Promise<CompanyPaginationOutput | null> {

        console.log('searchCompanys');

        const queryGen = CompanyModel.find();
        // .find({ data: { $ne: null } });

        console.log('searchQuery', searchQuery)

        if (searchQuery)
            queryGen.queryParse(searchQuery, searchLogic)


        return PaginationQuery({
            model: CompanyModel,
            paginationQuery: pagination,
            filter: queryGen.getQuery(),
            info,
            customProjection: searchQuery ? CompanySearchQuery.genProjection(searchQuery) : {}
        });
    }

    @Query(_returns => CompanyMedia, { nullable: true })
    async getFullCompany(@Arg("id", () => String) id: String) {

        const findCompany = await CompanyModel.findOne({ id }).lean();

        console.log('getFullCompany', findCompany, id);

        if (findCompany) {
            const sortedUpdate = findCompany.updates?.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            // const sortedUpdateRequest = findCompany.requests?.sort(sortByCreatedAt);

            return findCompany
        } else {
            return null;
        }
    }

    @Mutation(_ => Company, { description: "Ajouter un (nouvel) company (staff)" })
    async createCompany(@Arg("data", _ => CompanyInput) dataInput: CompanyInput) {

        const update = await CompanyInput.createUpdate(
            dataInput, 'direct_update', {
            author: '',
            verifiedBy: ''
        }
        );

        let model = await update.save();

        let json = model.toJSON();

        return json.data
    }

    @Authorized<IUserRoles>(IUserRoles['ADMIN'])
    async updateCompany(
        @Arg("id", () => String) id: string,
        @Arg("data", _ => CompanyInput) dataInput: CompanyInput
    ) {

        const update = await CompanyInput.createUpdate(dataInput, 'direct_update', {
            author: '',
            verifiedBy: ''
        });

        let data = await update.addTo(id);

        if (!data) return null;

        return data.data;
    }
}