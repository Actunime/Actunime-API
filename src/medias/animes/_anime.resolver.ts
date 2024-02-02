import { Arg, Info, Mutation, Query, Resolver } from "type-graphql";
import { MediaSearchLogic, MediaUpdateOptionArg, Pagination } from "../../utils";
import { AnimeModel, AnimePaginationOutput, } from "./_anime.model";
import { Anime, AnimeSearchQuery } from "./_anime.type";
import { fieldsProjection } from 'graphql-fields-list'
import { PaginationQuery } from "../../utils/_pagination";
import { AnimeInput } from "./_anime.input";


@Resolver(Anime)
export class AnimeResolver {

    @Query(_return => Anime, { nullable: true })
    async getAnime(@Arg("id", () => String) id: string, @Info() info: any): Promise<Anime | null> {

        const findAnime = await AnimeModel.findOne({ id }, fieldsProjection(info));

        if (findAnime && findAnime.visible && findAnime.data) {

            const { pubId, data } = findAnime;

            return { id: pubId, ...data };

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

        const queryGen = AnimeModel
            .find({ data: { $ne: null } });

        if (searchQuery)
            queryGen.genQuery(searchQuery, searchLogic)


        return PaginationQuery({
            model: AnimeModel,
            paginationQuery: pagination,
            filter: queryGen.getQuery(),
            info,
            customProjection: searchQuery ? AnimeSearchQuery.genProjection(searchQuery) : {}
        });
    }

    // @Authorized("")
    // @Query(_returns => AnimeMediaOutput, { nullable: true })
    // async getFullAnime(@Arg("id", () => Number) id: number): Promise<AnimeMediaOutput | null> {

    //     const findAnime = await AnimeModel.findOne({ id });

    //     if (findAnime) {


    //         function sortByCreatedAt(a: IMediaUpdates<any>, b: IMediaUpdates<any>) {
    //             if (!b.createdAt || !a.createdAt) return 0;
    //             return b.createdAt.getTime() - a.createdAt.getTime()
    //         }

    //         const sortedUpdate = findAnime.updates.sort(sortByCreatedAt);
    //         const sortedUpdateRequest = findAnime.requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    //         return {
    //             ...findAnime.toJSON(),
    //             data: findAnime.data,
    //             lastRequestDate: sortedUpdateRequest[0].createdAt,
    //             lastUpdateDate: sortedUpdate[0].createdAt
    //         }

    //     } else {
    //         return null;
    //     }
    // }

    // @Query(_returns => AnimeMediaPaginationOutput, { nullable: true })
    // async searchFullAnime(
    //     @Arg("pagination", () => Pagination, { nullable: true }) pagination: Pagination | null,
    //     @Arg("searchQuery", () => AnimeSearchQuery, { nullable: true }) searchQuery: AnimeSearchQuery | null,
    //     @Info() info: any
    // ): Promise<AnimeMediaPaginationOutput> {
    //     let currentPage = pagination?.page || 1;
    //     let limitPerPage = pagination?.limit || 20;

    //     // Mise en place query
    //     let queryGen = AnimeModel.find()

    //     if (searchQuery) {

    //         if (searchQuery.title)
    //             queryGen
    //                 .searchMediaByTitle(searchQuery.title)

    //     }

    //     const generatedQuery = queryGen.getQuery();

    //     const totalResults = await AnimeModel.countDocuments(generatedQuery);
    //     const searchResult = await AnimeModel.find(generatedQuery)
    //         .select(Object.keys(fieldsProjection(info)).map((s) => s.replace('results.', '')))
    //         .skip(limitPerPage * (currentPage - 1))
    //         .limit(limitPerPage);

    //     const totalPage = Math.round(totalResults / limitPerPage) < 1 ? 1 : Math.round(totalResults / limitPerPage);

    //     function sortByCreatedAt(a: IMediaUpdates<any>, b: IMediaUpdates<any>) {
    //         if (!b.createdAt || !a.createdAt) return 0;
    //         return b.createdAt.getTime() - a.createdAt.getTime()
    //     }

    //     return {
    //         currentPage,
    //         totalPage,
    //         limitPerPage,
    //         totalResults,
    //         hasNextPage: currentPage < totalPage,
    //         hasPrevPage: currentPage >= 1 && currentPage < totalPage,
    //         results: searchResult.map((animeMedia) => {
    //             const sortedUpdate = animeMedia.updates?.sort(sortByCreatedAt);
    //             const sortedUpdateRequest = animeMedia.requests?.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    //             return {
    //                 ...animeMedia.toJSON(),
    //                 lastRequestDate: sortedUpdateRequest?.[0]?.createdAt || null,
    //                 lastUpdateDate: sortedUpdate?.[0]?.createdAt || null,
    //             }
    //         })
    //     };
    // }

    @Mutation(_ => Anime, { description: "Ajouter un (nouvel) anime (staff)" })
    async createAnime(
        @Arg("data", _ => AnimeInput) dataInput: AnimeInput,
        @Arg("options", _ => MediaUpdateOptionArg) options: MediaUpdateOptionArg
    ): Promise<Anime> {

        const update = await AnimeInput.createUpdate(dataInput, 'direct_update', options.visible || false);

        let model = await update.save();

        let json = model.toJSON();

        return {
            id: json.pubId,
            ...json.data,
        }

    }


    // @Mutation(_ => MediaUpdateOutput, { description: "Demande d'ajout d'un (nouvel) anime" })
    // async createAnimeRequest(
    //     @Arg("data", _ => AnimeInput) dataInput: AnimeInput,
    //     @Arg("options", _ => MediaUpdateOptionArg) options: MediaUpdateOptionArg
    // ): Promise<MediaUpdateOutput> {

    //     const author = undefined;

    //     const animeInput = await new AnimeInput().init(dataInput, "request");

    //     const request = await animeInput.createRequest({
    //         label: "Anime",
    //         action: "Demande d'ajout d'un Anime",
    //         field: { author, moderator: author, visible: options.setUpdatePublic }
    //     });

    //     await request.model.validate();

    //     // Validation
    //     await Promise.all(animeInput.mediasToSave.map(({ model }) => {
    //         return model.save({ validateBeforeSave: false });
    //     }))

    //     return {
    //         mediaType: MediaType.ANIME,
    //         message: "La demande a bien été crée.",
    //         pubId: request.model.pubId
    //     }
    // }

    // @Mutation(_ => MediaUpdateOutput, { description: "Modification d'un Anime" })
    // async updateAnime(
    //     @Arg('animeToUpdate') mediaToUpdate: string,
    //     @Arg('versionToUpdate', { nullable: true, description: "Modifier une précédente modification" }) versionToUpdate: number,
    //     @Arg("data", _ => AnimeInput) dataInput: AnimeInput,
    //     @Arg("options", _ => MediaUpdateOptionArg) options: MediaUpdateOptionArg
    // ): Promise<MediaUpdateOutput> {

    //     const author = undefined;

    //     const animeInput = await new AnimeInput().init(dataInput, "direct_update");

    //     const update = await animeInput.createUpdate({
    //         mediaToUpdate,
    //         versionToUpdate,
    //         public: options.setMediaPublic,
    //         label: "Anime",
    //         action: "Modification d'un Anime",
    //         field: {
    //             author,
    //             moderator: author,
    //             visible: options.setUpdatePublic
    //         }
    //     });

    //     await update.model.validate();

    //     // Validation
    //     await Promise.all(animeInput.mediasToSave.map(({ model }) => {
    //         return model.save({ validateBeforeSave: false });
    //     }))

    //     return {
    //         mediaType: MediaType.ANIME,
    //         message: "L'anime a bien été crée.",
    //         pubId: update.model.pubId
    //     }
    // }



    // @Mutation(_ => MediaUpdateOutput, { description: "Demande de Modification d'un Anime" })
    // async requestAnimeUpdate(
    //     @Arg('animeToUpdate') mediaToUpdate: string,
    //     @Arg('versionToUpdate', { nullable: true, description: "Modifier une précédente modification" }) versionToUpdate: number,
    //     @Arg("data", _ => AnimeInput) dataInput: AnimeInput,
    //     @Arg("options", _ => MediaUpdateOptionArg) options: MediaUpdateOptionArg
    // ): Promise<MediaUpdateOutput> {

    //     const author = undefined;

    //     const animeInput = await new AnimeInput().init(dataInput, "request");

    //     const request = await animeInput.createRequest({
    //         mediaToUpdate,
    //         versionToUpdate,
    //         public: options.setMediaPublic,
    //         label: "Anime",
    //         action: "Demande de Modification d'un Anime",
    //         field: {
    //             author,
    //             moderator: author,
    //             visible: options.setUpdatePublic
    //         }
    //     });

    //     await request.model.validate();

    //     // Validation
    //     await Promise.all(animeInput.mediasToSave.map(({ model }) => {
    //         return model.save({ validateBeforeSave: false });
    //     }))

    //     return {
    //         mediaType: MediaType.ANIME,
    //         message: "L'anime a bien été crée.",
    //         pubId: request.model.pubId
    //     }
    // }
}