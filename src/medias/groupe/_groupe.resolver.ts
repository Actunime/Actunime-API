import { Arg, Authorized, Info, Mutation, Query, Resolver } from "type-graphql";
import { MediaSearchLogic, Pagination } from "../../utils";
import { GroupeMedia, GroupeMediaPagination, GroupeModel } from "./_groupe.model";
import { Groupe, GroupeSearchQuery } from "./_groupe.type";
import { PaginationQuery } from "../../utils/_pagination";
import { GroupeInput } from "./_groupe.input";
import { IUserRoles } from "../users/_user.type";


@Resolver(Groupe)
export class GroupeResolver {

    @Query(_return => GroupeMedia, { nullable: true })
    async groupe(@Arg("id", () => String) id: string, @Info() info: any) {
        try {
            const anime = await GroupeModel.findOne({ id, data: { $ne: undefined } }).dynamicPopulate(info)
            return anime?.toJSON();
        } catch (err) {
            console.error(err)
            return null
        }
    }

    @Query(_returns => GroupeMediaPagination, { nullable: true })
    async groupes(

        @Arg("pagination", () => Pagination, { nullable: true })
        paginationQuery: Pagination | null,

        @Arg("searchQuery", () => GroupeSearchQuery, { nullable: true })
        searchQuery: GroupeSearchQuery | null,

        @Arg("searchLogic", () => MediaSearchLogic, { nullable: true, defaultValue: 'OR' })
        searchLogic: MediaSearchLogic,

        @Info()
        info: any

    ): Promise<GroupeMediaPagination | null> {

        const filter = GroupeSearchQuery.parse<typeof GroupeModel>(searchQuery, searchLogic);

        console.log('query', filter)

        return PaginationQuery({
            model: GroupeModel,
            paginationQuery,
            filter,
            info,
            customProjection: searchQuery ? GroupeSearchQuery.genProjection(searchQuery) : {}
        });
    }
    @Mutation(_ => Groupe, { description: "Ajouter un (nouvel) groupe (staff)" })
    async createGroupe(@Arg("data", () => GroupeInput) dataInput: GroupeInput) {

        const update = await GroupeInput.createUpdate(
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
    async updateGroupe(
        @Arg("id", () => String) id: string,
        @Arg("data", _ => GroupeInput) dataInput: GroupeInput
    ) {

        const update = await GroupeInput.createUpdate(dataInput, 'direct_update', {
            author: '',
            verifiedBy: ''
        });

        let data = await update.addTo(id);

        if (!data) return null;

        return data.data;
    }
}