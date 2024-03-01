import { Arg, Authorized, Info, Mutation, Query, Resolver } from "type-graphql";
import { MediaSearchLogic, Pagination } from "../../utils";
import { Manga, MangaSearchQuery, MangaMedia, MangaMediaPagination, MangaModel } from "./_manga.type";
import { PaginationQuery } from "../../utils/_pagination";
import { MangaInput } from "./_manga.input";
import { IUserRoles } from "../users/_user.type";


@Resolver(Manga)
export class MangaResolver {
    @Query(_return => MangaMedia, { nullable: true })
    async manga(@Arg("id", () => String) id: string, @Info() info: any) {
        try {
            const manga = await MangaModel.findOne({ id, data: { $ne: undefined } }).dynamicPopulate(info)
            return manga?.toJSON();
        } catch (err) {
            console.error(err)
            return null
        }
    }

    @Query(_returns => MangaMediaPagination, { nullable: true })
    async mangas(

        @Arg("pagination", () => Pagination, { nullable: true })
        paginationQuery: Pagination | null,

        @Arg("searchQuery", () => MangaSearchQuery, { nullable: true })
        searchQuery: MangaSearchQuery | null,

        @Arg("searchLogic", () => MediaSearchLogic, { nullable: true, defaultValue: 'OR' })
        searchLogic: MediaSearchLogic,

        @Info()
        info: any

    ): Promise<MangaMediaPagination | null> {

        const filter = MangaSearchQuery.parse<typeof MangaModel>(searchQuery, searchLogic);

        console.log('query', filter)

        return PaginationQuery({
            model: MangaModel,
            paginationQuery,
            filter,
            info,
            customProjection: searchQuery ? MangaSearchQuery.genProjection(searchQuery) : {}
        });
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