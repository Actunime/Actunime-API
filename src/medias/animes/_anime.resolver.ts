import { prop, types } from "@typegoose/typegoose";
import { Arg, Mutation, ObjectType, Query, Resolver } from "type-graphql";
import { Anime, AnimeMedia, AnimeMediaOutput, AnimeMediaPaginationOutput, AnimeModel, AnimePaginationOutput, AnimeSearchQuery } from "./_anime.type";
import { AnimeInput } from "./_anime.input";
import { genMediaFromUpdate } from "../ulti.query";
import { Pagination, SearchQuery, MediaFormatOutput, PaginationOutput } from "../util.type";


@Resolver(Anime)
export class AnimeResolver {

    @Query(_return => Anime, { nullable: true })
    async getAnime(@Arg("id", () => String) id: string): Promise<Anime | null> {

        const findAnime = await AnimeModel.findOne({ id });

        if (findAnime && findAnime.public) {

            const { data } = findAnime.toJSON();

            return data;

        } else {
            return null;
        }

    }

    @Query(_returns => AnimePaginationOutput, { nullable: true })
    async searchAnimes(
        @Arg("pagination", () => Pagination, { nullable: true }) pagination: Pagination | null,
        @Arg("searchQuery", () => AnimeSearchQuery, { nullable: true }) searchQuery: AnimeSearchQuery | null
    ): Promise<AnimePaginationOutput> {
        let page = pagination?.page || 1;
        let perPage = pagination?.limit || 20;

        // Mise en place query
        let queryGen = AnimeModel.find()

        if (searchQuery) {

            if (searchQuery.title)
                queryGen
                    .searchMediaByTitle(searchQuery.title)

        }

        // Mise en place pagination & résultats;

        const generatedQuery = queryGen.getQuery();
        const resultsCount = await AnimeModel.countDocuments(generatedQuery);
        const searchResult = await AnimeModel.find(generatedQuery)
            .skip(perPage * (page - 1))
            .limit(perPage);

        const totalPage = Math.round(resultsCount / perPage) < 1 ? 1 : Math.round(resultsCount / perPage);

        console.log('result', searchResult.map((x) => x.toJSON()))
        return {
            currentPage: page,
            totalPage: totalPage,
            limitPerPage: perPage,
            resultsCount: resultsCount,
            hasNextPage: page < totalPage,
            hasPrevPage: page >= 1 && page < totalPage,
            results: searchResult.map((x) => ({ id: x.id, ...x.data }))
        };
    }

    @Query(_returns => AnimeMediaOutput, { nullable: true })
    async getFullAnime(@Arg("id", () => Number) id: number): Promise<AnimeMediaOutput | null> {

        const findAnime = await AnimeModel.findOne({ id });

        if (findAnime) {

            const data = genMediaFromUpdate(findAnime.updates)
            const sortedUpdate = findAnime.updates.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            const sortedUpdateRequest = findAnime.updatesRequests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

            return {
                ...findAnime.toJSON(),
                data,
                lastRequestDate: sortedUpdateRequest[0].createdAt,
                lastUpdateDate: sortedUpdate[0].createdAt
            }

        } else {
            return null;
        }
    }

    @Query(_returns => [AnimeMediaPaginationOutput], { nullable: true })
    async searchFullAnime(): Promise<AnimeMediaPaginationOutput> {
        return {
            currentPage: 0,
            totalPage: 0,
            limitPerPage: 0,
            resultsCount: 0,
            hasNextPage: false,
            hasPrevPage: false,
            results: []
        };
    }

    @Mutation(_ => Boolean, { description: "Ajouter un (nouvel) anime" })
    async addAnime(@Arg("data") dataInput: AnimeInput, @Arg("public") visible: boolean) {
        const animeInput = await new AnimeInput().init(dataInput);

        const animeModel = new AnimeModel({
            updates: [{
                versionId: 1,
                data: animeInput,
                createdAt: new Date(),
                author: null,
                moderator: null
            }],
            visible
        });

        await animeModel.save();

        return false;
    }


    @Mutation(_ => Boolean, { description: "Faire une demande (d'ajout) d'un (nouvel) anime" })
    async addAnimeRequest(@Arg("data") dataInput: AnimeInput) {
        const animeInput = await new AnimeInput()
            .init(dataInput);

        const animeModel = new AnimeModel(
            // new AnimeMedia(
            {
                updatesRequests: [{
                    versionId: 1,
                    data: animeInput,
                    createdAt: new Date(),
                    author: 0,
                    status: 'UNVERIFIED',
                    acceptNewUpdateFromAuthor: false
                }],
                updates: [],
                public: false
            }
            // )
        );

        AnimeModel.create({
            updatesRequests: [{
                versionId: 1,
                data: animeInput,
                createdAt: new Date(),
                author: 0,
                status: 'UNVERIFIED',
                acceptNewUpdateFromAuthor: false
            }],
            updates: [],
            public: false
        })

        await animeModel.save();

        return false;
    }

    @Mutation(_ => Boolean, { description: "Faire une modification sur une demande de modification (existante)" })
    async editAnimeUpdateRequest(@Arg('animeId') id: number, @Arg('updateRequestId') versionId: number, @Arg("data") dataInput: AnimeInput) {

        const findAnime = await AnimeModel.findOne({ id });

        if (findAnime) {

            const findVersion = findAnime.updatesRequests?.find(r => r.versionId === versionId);

            if (findVersion) {
                if (findVersion.acceptNewUpdateFromAuthor) {
                    // Vérifier AUSSI si l'auteur de la requête est égale a l'auteur de la demande.

                    const versionUpdate = await new AnimeInput().init(dataInput);

                    findVersion.createdAt = new Date();
                    findVersion.status = "NEW_UPDATE_FROM_REJECTION";
                    findVersion.data = {
                        ...versionUpdate
                    }

                    findVersion.acceptNewUpdateFromAuthor = false;

                    if (findAnime.updatesRequests) {
                        findAnime.updatesRequests = [
                            findVersion,
                            ...findAnime.updatesRequests.filter(u => u.versionId !== versionId)
                        ]

                        return true;
                    }

                    return false;
                }

                return false;
            }

        } else {
            return false;
        }
    }

    @Mutation(_ => Boolean, { description: "Faire une demande de (modification) sur un Anime (existant)" })
    async addAnimeUpdateRequest(@Arg('animeId') id: number, @Arg("data") dataInput: AnimeInput) {

        const findAnime = await AnimeModel.findOne({ id });

        if (findAnime) {
            const animeInput = await new AnimeInput().init(dataInput);

            findAnime?.updatesRequests?.push({
                versionId: findAnime.updatesRequests.length + 1,
                data: animeInput,
                createdAt: new Date(),
                status: 'UNVERIFIED',
                acceptNewUpdateFromAuthor: false,
                author: 0
            })

            await findAnime.save();

            return true;
        } else {
            return false;
        }
    }

    @Mutation(_ => Boolean, { description: "Modifier un Anime (staff)" })
    async addAnimeUpdate(@Arg('animeId') id: number, @Arg("data") dataInput: AnimeInput) {

        const findAnime = await AnimeModel.findOne({ id });

        if (findAnime) {
            const animeInput = await new AnimeInput().init(dataInput);

            findAnime?.updates?.push({
                versionId: findAnime.updates.length + 1,
                data: animeInput,
                createdAt: new Date(),
                author: 0,
                moderator: 0,
                public: false,
            })

            await findAnime.save();

            return true;
        } else {
            return false;
        }
    }




}

