import { Arg, Authorized, Info, Mutation, Query, Resolver } from "type-graphql";
import { MediaSearchLogic, Pagination } from "../../utils";
import { MangaMedia, MangaModel, MangaPaginationOutput } from "./_manga.model";
import { Manga, MangaSearchQuery } from "./_manga.type";
import { fieldsProjection } from 'graphql-fields-list'
import { PaginationQuery } from "../../utils/_pagination";
import { MangaInput } from "./_manga.input";
import { IUserRoles } from "../users/_user.type";


@Resolver(Manga)
export class MangaResolver {

    @Query(_return => Manga, { nullable: true })
    async getManga(@Arg("id", () => String) id: string, @Info() info: any) {

        const projection = info ?
            Object.fromEntries(
                Object.keys(
                    Object.assign(fieldsProjection(info), { id: 1 })
                ).map(key => [key.replace(key, 'data.' + key), 1])) : {};

        console.log(projection)

        const findManga = await MangaModel.findOne({ id }, { id: 1, ...projection }).lean();

        console.log('getManga', findManga);
        // TODO: check le statut (public ou non etc...)
        if (findManga && findManga.data) {

            console.log("CA RETOURNE")
            const { id, data } = findManga;

            return data;

        } else {
            return null;
        }

    }

    @Query(_returns => MangaPaginationOutput, { nullable: true })
    async searchMangas(

        @Arg("pagination", () => Pagination, { nullable: true })
        pagination: Pagination | null,

        @Arg("searchQuery", () => MangaSearchQuery, { nullable: true })
        searchQuery: MangaSearchQuery | null,

        @Arg("searchLogic", () => MediaSearchLogic, { nullable: true, defaultValue: 'OR' })
        searchLogic: MediaSearchLogic,

        @Info()
        info: any

    ): Promise<MangaPaginationOutput | null> {

        console.log('searchMangas');

        const queryGen = MangaModel.find();
        // .find({ data: { $ne: null } });

        console.log('searchQuery', searchQuery)

        if (searchQuery)
            queryGen.queryParse(searchQuery, searchLogic)


        return PaginationQuery({
            model: MangaModel,
            paginationQuery: pagination,
            filter: queryGen.getQuery(),
            info,
            customProjection: searchQuery ? MangaSearchQuery.genProjection(searchQuery) : {}
        });
    }

    @Query(_returns => MangaMedia, { nullable: true })
    async getFullManga(@Arg("id", () => String) id: String) {

        const findManga = await MangaModel.findOne({ id }).lean();

        console.log('getFullManga', findManga, id);

        if (findManga) {
            const sortedUpdate = findManga.updates?.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            // const sortedUpdateRequest = findManga.requests?.sort(sortByCreatedAt);

            return findManga
        } else {
            return null;
        }
    }

    @Mutation(_ => Manga, { description: "Ajouter un (nouvel) manga (staff)" })
    async createManga(@Arg("data", _ => MangaInput) dataInput: MangaInput) {

        const update = await MangaInput.createUpdate(
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
    async updateManga(
        @Arg("id", () => String) id: string,
        @Arg("data", _ => MangaInput) dataInput: MangaInput
    ) {

        const update = await MangaInput.createUpdate(dataInput, 'direct_update', {
            author: '',
            verifiedBy: ''
        });

        let data = await update.addTo(id);

        if (!data) return null;

        return data.data;
    }
}