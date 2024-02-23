import { Arg, Authorized, Info, Mutation, Query, Resolver } from "type-graphql";
import { MediaSearchLogic, Pagination } from "../../utils";
import { AnimeMedia, AnimeMediaPagination, AnimeModel } from "./_anime.model";
import { Anime, AnimeSearchQuery } from "./_anime.type";
import { PaginationQuery } from "../../utils/_pagination";
import { AnimeInput } from "./_anime.input";
import { IUserRoles } from "../users/_user.type";


@Resolver(Anime)
export class AnimeResolver {

    @Query(_return => AnimeMedia, { nullable: true })
    async anime(@Arg("id", () => String) id: string, @Info() info: any) {
        try {
            const anime = await AnimeModel.findOne({ id, data: { $ne: undefined } }).dynamicPopulate(info)
            return anime?.toJSON();
        } catch (err) {
            console.error(err)
            return null
        }
    }

    @Query(_returns => AnimeMediaPagination, { nullable: true })
    async animes(

        @Arg("pagination", () => Pagination, { nullable: true })
        paginationQuery: Pagination | null,

        @Arg("searchQuery", () => AnimeSearchQuery, { nullable: true })
        searchQuery: AnimeSearchQuery | null,

        @Arg("searchLogic", () => MediaSearchLogic, { nullable: true, defaultValue: 'OR' })
        searchLogic: MediaSearchLogic,

        @Info()
        info: any

    ): Promise<AnimeMediaPagination | null> {

        const filter = AnimeSearchQuery.parse(searchQuery, searchLogic, AnimeModel);

        console.log('query', filter)

        return PaginationQuery({
            model: AnimeModel,
            paginationQuery,
            filter,
            info,
            customProjection: searchQuery ? AnimeSearchQuery.genProjection(searchQuery) : {}
        });
    }

    @Mutation(_ => Anime, { description: "Ajouter un (nouvel) anime (staff)" })
    async createAnime(@Arg("data", _ => AnimeInput) dataInput: AnimeInput) {

        const update = await AnimeInput.createUpdate(
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
    async updateAnime(
        @Arg("id", () => String) id: string,
        @Arg("data", _ => AnimeInput) dataInput: AnimeInput
    ) {

        const update = await AnimeInput.createUpdate(dataInput, 'direct_update', {
            author: '',
            verifiedBy: ''
        });

        let data = await update.addTo(id);

        if (!data) return null;

        return data.data;
    }
}