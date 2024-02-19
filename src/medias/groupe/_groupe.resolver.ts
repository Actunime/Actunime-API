import { Arg, Authorized, Info, Mutation, Query, Resolver } from "type-graphql";
import { MediaSearchLogic, Pagination } from "../../utils";
import { GroupeMedia, GroupeModel, GroupePaginationOutput } from "./_groupe.model";
import { Groupe, GroupeSearchQuery } from "./_groupe.type";
import { fieldsProjection } from 'graphql-fields-list'
import { PaginationQuery } from "../../utils/_pagination";
import { GroupeInput } from "./_groupe.input";
import { IUserRoles } from "../users/_user.type";


@Resolver(Groupe)
export class GroupeResolver {

    @Query(_return => Groupe, { nullable: true })
    async getGroupe(@Arg("id", () => String) id: string, @Info() info: any) {

        const projection = info ?
            Object.fromEntries(
                Object.keys(
                    Object.assign(fieldsProjection(info), { id: 1 })
                ).map(key => [key.replace(key, 'data.' + key), 1])) : {};

        console.log(projection)

        const findGroupe = await GroupeModel.findOne({ id }, { id: 1, ...projection }).lean();

        console.log('getGroupe', findGroupe);
        // TODO: check le statut (public ou non etc...)
        if (findGroupe && findGroupe.data) {

            console.log("CA RETOURNE")
            const { id, data } = findGroupe;

            return data;

        } else {
            return null;
        }

    }

    @Query(_returns => GroupePaginationOutput, { nullable: true })
    async searchGroupes(

        @Arg("pagination", () => Pagination, { nullable: true })
        pagination: Pagination | null,

        @Arg("searchQuery", () => GroupeSearchQuery, { nullable: true })
        searchQuery: GroupeSearchQuery | null,

        @Arg("searchLogic", () => MediaSearchLogic, { nullable: true, defaultValue: 'OR' })
        searchLogic: MediaSearchLogic,

        @Info()
        info: any

    ): Promise<GroupePaginationOutput | null> {

        console.log('searchGroupes');

        const queryGen = GroupeModel.find();
        // .find({ data: { $ne: null } });

        console.log('searchQuery', searchQuery)

        if (searchQuery)
            queryGen.queryParse(searchQuery, searchLogic)


        return PaginationQuery({
            model: GroupeModel,
            paginationQuery: pagination,
            filter: queryGen.getQuery(),
            info,
            customProjection: searchQuery ? GroupeSearchQuery.genProjection(searchQuery) : {}
        });
    }

    @Query(_returns => GroupeMedia, { nullable: true })
    async getFullGroupe(@Arg("id", () => String) id: String) {

        const findGroupe = await GroupeModel.findOne({ id }).lean();

        console.log('getFullGroupe', findGroupe, id);

        if (findGroupe) {
            const sortedUpdate = findGroupe.updates?.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            // const sortedUpdateRequest = findGroupe.requests?.sort(sortByCreatedAt);

            return findGroupe
        } else {
            return null;
        }
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