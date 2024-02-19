import { Arg, Authorized, Info, Mutation, Query, Resolver } from "type-graphql";
import { MediaSearchLogic, Pagination } from "../../utils";
import { AnimeMedia, AnimeModel, AnimePaginationOutput } from "./_anime.model";
import { Anime, AnimeSearchQuery } from "./_anime.type";
import { fieldsProjection } from 'graphql-fields-list'
import { PaginationQuery } from "../../utils/_pagination";
import { AnimeInput } from "./_anime.input";
import { IUserRoles } from "../users/_user.type";


@Resolver(Anime)
export class AnimeResolver {

    @Query(_return => Anime, { nullable: true })
    async getAnime(@Arg("id", () => String) id: string, @Info() info: any) {

        const projection = info ?
            Object.fromEntries(
                Object.keys(
                    Object.assign(fieldsProjection(info), { id: 1 })
                ).map(key => [key.replace(key, 'data.' + key), 1])) : {};

        console.log(projection)

        const findAnime = await AnimeModel.findOne({ id }, { id: 1, ...projection }).lean();

        console.log('getAnime', findAnime);
        // TODO: check le statut (public ou non etc...)
        if (findAnime && findAnime.data) {

            console.log("CA RETOURNE")
            const { id, data } = findAnime;

            return data;

        } else {
            return null;
        }

    }

    @Query(_returns => AnimePaginationOutput, { nullable: true })
    async searchAnimes(

        @Arg("pagination", () => Pagination, { nullable: true })
        pagination: Pagination | null,

        @Arg("searchQuery", () => AnimeSearchQuery, { nullable: true })
        searchQuery: AnimeSearchQuery | null,

        @Arg("searchLogic", () => MediaSearchLogic, { nullable: true, defaultValue: 'OR' })
        searchLogic: MediaSearchLogic,

        @Info()
        info: any

    ): Promise<AnimePaginationOutput | null> {

        console.log('searchAnimes');

        const queryGen = AnimeModel.find();
        // .find({ data: { $ne: null } });

        console.log('searchQuery', searchQuery)

        if (searchQuery)
            queryGen.queryParse(searchQuery, searchLogic)


        return PaginationQuery({
            model: AnimeModel,
            paginationQuery: pagination,
            filter: queryGen.getQuery(),
            info,
            customProjection: searchQuery ? AnimeSearchQuery.genProjection(searchQuery) : {}
        });
    }

    @Query(_returns => AnimeMedia, { nullable: true })
    async getFullAnime(@Arg("id", () => String) id: String) {

        const findAnime = await AnimeModel.findOne({ id }).lean();

        console.log('getFullAnime', findAnime, id);

        if (findAnime) {
            const sortedUpdate = findAnime.updates?.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            // const sortedUpdateRequest = findAnime.requests?.sort(sortByCreatedAt);

            return findAnime
        } else {
            return null;
        }
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