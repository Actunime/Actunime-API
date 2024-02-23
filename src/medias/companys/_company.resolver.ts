import { Arg, Authorized, Info, Mutation, Query, Resolver } from "type-graphql";
import { MediaSearchLogic, Pagination } from "../../utils";
import { CompanyMedia, CompanyMediaPagination, CompanyModel } from "./_company.model";
import { Company, CompanySearchQuery } from "./_company.type";
import { PaginationQuery } from "../../utils/_pagination";
import { CompanyInput } from "./_company.input";
import { IUserRoles } from "../users/_user.type";

@Resolver(Company)
export class CompanyResolver {

    @Query(_return => CompanyMedia, { nullable: true })
    async company(@Arg("id", () => String) id: string, @Info() info: any) {
        try {
            const anime = await CompanyModel.findOne({ id, data: { $ne: undefined } }).dynamicPopulate(info)
            return anime?.toJSON();
        } catch (err) {
            console.error(err)
            return null
        }
    }

    @Query(_returns => CompanyMediaPagination, { nullable: true })
    async companys(

        @Arg("pagination", () => Pagination, { nullable: true })
        paginationQuery: Pagination | null,

        @Arg("searchQuery", () => CompanySearchQuery, { nullable: true })
        searchQuery: CompanySearchQuery | null,

        @Arg("searchLogic", () => MediaSearchLogic, { nullable: true, defaultValue: 'OR' })
        searchLogic: MediaSearchLogic,

        @Info()
        info: any

    ): Promise<CompanyMediaPagination | null> {

        const filter = CompanySearchQuery.parse<typeof CompanyModel>(searchQuery, searchLogic);

        console.log('query', filter)

        return PaginationQuery({
            model: CompanyModel,
            paginationQuery,
            filter,
            info,
            customProjection: searchQuery ? CompanySearchQuery.genProjection(searchQuery) : {}
        });
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