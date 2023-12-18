import { Arg, Mutation, Query, Resolver } from "type-graphql";
import { Anime, AnimeMediaOutput, AnimeMediaPaginationOutput, AnimeModel, AnimePaginationOutput, AnimeSearchQuery } from "./_anime.type";
import { AnimeInput } from "./_anime.input";
import { MediaType, MediaUpdateOutput, Pagination } from "../util.type";


@Resolver(Anime)
export class AnimeResolver {

    @Query(_return => Anime, { nullable: true })
    async getAnime(@Arg("id", () => String) id: string): Promise<Anime | null> {

        const findAnime = await AnimeModel.findOne({ id }).select('data id');

        if (findAnime && findAnime.public) {


            const { pubId: id, data } = findAnime.toJSON();

            return { id, ...data };

        } else {
            return null;
        }

    }

    @Query(_returns => AnimePaginationOutput, { nullable: true })
    async searchAnimes(
        @Arg("pagination", () => Pagination, { nullable: true }) pagination: Pagination | null,
        @Arg("searchQuery", () => AnimeSearchQuery, { nullable: true }) searchQuery: AnimeSearchQuery | null
    ): Promise<AnimePaginationOutput> {
        let currentPage = pagination?.page || 1;
        let limitPerPage = pagination?.limit || 20;

        // Mise en place query
        let queryGen = AnimeModel.find()

        if (searchQuery) {

            if (searchQuery.title)
                queryGen
                    .searchMediaByTitle(searchQuery.title)

        }

        queryGen.select('pubId data');

        // Mise en place pagination & résultats;

        const generatedQuery = queryGen.getQuery();
        const totalResults = await AnimeModel.countDocuments(generatedQuery);
        const searchResult = await AnimeModel.find(generatedQuery)
            .skip(limitPerPage * (currentPage - 1))
            .limit(limitPerPage);

        const totalPage = Math.round(totalResults / limitPerPage) < 1 ? 1 : Math.round(totalResults / limitPerPage);

        console.log('result', searchResult.map((x) => x.toJSON()))
        return {
            currentPage,
            totalPage,
            limitPerPage,
            totalResults,
            hasNextPage: currentPage < totalPage,
            hasPrevPage: currentPage >= 1 && currentPage < totalPage,
            results: searchResult.map((x) => ({ id: x.pubId, ...x.data }))
        };
    }

    @Query(_returns => AnimeMediaOutput, { nullable: true })
    async getFullAnime(@Arg("id", () => Number) id: number): Promise<AnimeMediaOutput | null> {

        const findAnime = await AnimeModel.findOne({ id });

        if (findAnime) {

            const sortedUpdate = findAnime.updates.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            const sortedUpdateRequest = findAnime.updatesRequests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

            return {
                ...findAnime.toJSON(),
                data: findAnime.data,
                lastRequestDate: sortedUpdateRequest[0].createdAt,
                lastUpdateDate: sortedUpdate[0].createdAt
            }

        } else {
            return null;
        }
    }

    @Query(_returns => [AnimeMediaPaginationOutput], { nullable: true })
    async searchFullAnime(
        @Arg("pagination", () => Pagination, { nullable: true }) pagination: Pagination | null,
        @Arg("searchQuery", () => AnimeSearchQuery, { nullable: true }) searchQuery: AnimeSearchQuery | null
    ): Promise<AnimeMediaPaginationOutput> {

        let currentPage = pagination?.page || 1;
        let limitPerPage = pagination?.limit || 20;

        // Mise en place query
        let queryGen = AnimeModel.find()

        if (searchQuery) {

            if (searchQuery.title)
                queryGen
                    .searchMediaByTitle(searchQuery.title)

        }

        // Mise en place pagination & résultats;

        const generatedQuery = queryGen.getQuery();
        const totalResults = await AnimeModel.countDocuments(generatedQuery);
        const searchResult = await AnimeModel.find(generatedQuery)
            .skip(limitPerPage * (currentPage - 1))
            .limit(limitPerPage);

        const totalPage = Math.round(totalResults / limitPerPage) < 1 ? 1 : Math.round(totalResults / limitPerPage);

        console.log('result', searchResult.map((x) => x.toJSON()))

        return {
            currentPage,
            totalPage,
            limitPerPage,
            totalResults,
            hasNextPage: currentPage < totalPage,
            hasPrevPage: currentPage >= 1 && currentPage < totalPage,
            results: searchResult.map((animeMedia) => {
                const sortedUpdate = animeMedia.updates.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                const sortedUpdateRequest = animeMedia.updatesRequests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                return {
                    ...animeMedia.toJSON(),
                    lastRequestDate: sortedUpdateRequest[0].createdAt,
                    lastUpdateDate: sortedUpdate[0].createdAt
                }
            })
        };
    }

    @Mutation(_ => MediaUpdateOutput, { description: "Ajouter un (nouvel) anime (staff)" })
    async addAnime(@Arg("data") dataInput: AnimeInput, @Arg("public") visible: boolean): Promise<MediaUpdateOutput> {
        // if (user.roles.includes("STAFF")) {
        //     return {
        //         mediaType: MediaType.ANIME,
        //         message: "Une erreur s'est produite.",
        //         error: "Vous n'êtes pas autorisé.",
        //     };
        // }

        try {
            const animeInput = await new AnimeInput().init(dataInput);

            const media = new AnimeModel({
                updates: [{
                    versionId: 1,
                    data: animeInput,
                    createdAt: new Date(),
                    author: null,
                    moderator: null
                }],
                updatesRequests: [],
                public: visible
            });

            try { // Mettre la validation des médias supplémentaires ici persons, characters, etc...
                await media.validate();
            } catch (err: any) {
                console.error(err);
                return {
                    mediaType: MediaType.ANIME,
                    message: "Les données saisies sont incorrectes.",
                    error: err.toString()
                };
            }

            try {
                const savedMedia = await media.save();

                return {
                    mediaType: MediaType.ANIME,
                    message: "Votre ajout a bien été pris en compte.",
                    id: savedMedia.pubId
                };


            } catch (err: any) {
                console.error(err);
                return {
                    mediaType: MediaType.ANIME,
                    message: "Une erreur innatendu s'est produite.",
                    error: "Un problème est survenue lors de la sauvegarde."
                };
            }

        } catch (err: any) {
            console.error(err);
            return {
                mediaType: MediaType.ANIME,
                message: "Une erreur s'est produite",
                error: err.toString(),
            };
        }
    }

    @Mutation(_ => MediaUpdateOutput, { description: "Modifier un Anime (staff)" })
    async addAnimeUpdate(@Arg('animeId') id: number, @Arg("data") dataInput: AnimeInput): Promise<MediaUpdateOutput> {
        // if (user.roles.includes("STAFF")) {
        //     return {
        //         mediaType: MediaType.ANIME,
        //         message: "Une erreur s'est produite.",
        //         error: "Vous n'êtes pas autorisé.",
        //     };
        // } 

        try {



            const findAnime = await AnimeModel.findOne({ id });

            if (!findAnime) {
                return {
                    mediaType: MediaType.ANIME,
                    message: "Une erreur s'est produite.",
                    error: "L'anime que vous voulez modifier n'existe pas.",
                };
            }

            const animeInput = await new AnimeInput().init(dataInput);

            findAnime?.updates?.push({
                versionId: findAnime.updates.length + 1,
                data: animeInput,
                createdAt: new Date(),
                author: 0,
                moderator: 0,
                public: false,
            })

            try {
                await findAnime.validate();
            } catch (err: any) {
                return {
                    mediaType: MediaType.ANIME,
                    message: "Les données saisies sont incorrectes.",
                    error: err.toString()
                };
            }


            try {
                const savedMedia = await findAnime.save();

                return {
                    mediaType: MediaType.ANIME,
                    message: "Votre modification a bien été pris en compte.",
                    id: savedMedia.pubId
                };
            } catch (err: any) {
                console.error(err);
                return {
                    mediaType: MediaType.ANIME,
                    message: "Une erreur innatendu s'est produite.",
                    error: "Une erreur est survenue lors de la sauvegarde."
                };
            }
        } catch (err: any) {
            console.error(err);
            return {
                mediaType: MediaType.ANIME,
                message: "Il y a un problème...",
                error: err.toString()
            };
        }
    }

    @Mutation(_ => MediaUpdateOutput, { description: "Faire une modification sur une demande de modification (existante)" })
    async editAnimeUpdate(@Arg('animeId') id: number, @Arg('updateId') versionId: number, @Arg("data") dataInput: AnimeInput): Promise<MediaUpdateOutput> {
        try {

            // if (user.roles.includes("STAFF")) {
            //     return {
            //         mediaType: MediaType.ANIME,
            //         message: "Une erreur s'est produite.",
            //         error: "Vous n'êtes pas autorisé.",
            //     };
            // }

            const findAnime = await AnimeModel.findOne({ id });

            if (!findAnime) {
                return {
                    mediaType: MediaType.ANIME,
                    message: "Une erreur s'est produite.",
                    error: "L'anime que vous voulez modifier n'existe pas.",
                };
            }

            if (!findAnime.updatesRequests) {
                return {
                    mediaType: MediaType.ANIME,
                    message: "Une erreur s'est produite.",
                    error: "Vous n'êtes pas autorisé.",
                }
            }

            const findVersion = findAnime.updatesRequests?.find(r => r.versionId === versionId);

            if (!findVersion) {
                return {
                    mediaType: MediaType.ANIME,
                    message: "Une erreur s'est produite.",
                    error: "La version que vous voulez modifier n'existe pas.",
                };
            }

            if (!findVersion.acceptNewUpdateFromAuthor) {
                return {
                    mediaType: MediaType.ANIME,
                    message: "Une erreur s'est produite.",
                    error: "Vous n'êtes pas autorisé.",
                };
            }


            // if (findVersion.author !== user.pubId) {
            //     return {
            //         mediaType: MediaType.ANIME,
            //         message: "Une erreur s'est produite.",
            //         error: "Vous n'êtes pas autorisé.",
            //     };
            // }


            const versionUpdate = await new AnimeInput().init(dataInput);

            findVersion.createdAt = new Date();
            findVersion.status = "NEW_UPDATE_FROM_AUTHOR";
            findVersion.data = {
                ...versionUpdate
            }

            findVersion.acceptNewUpdateFromAuthor = false;

            findAnime.updatesRequests = [
                findVersion,
                ...findAnime.updatesRequests.filter(u => u.versionId !== versionId)
            ]

            try {
                await findAnime.validate();
            } catch (err: any) {
                return {
                    mediaType: MediaType.ANIME,
                    message: "Les données saisies sont incorrectes.",
                    error: err.toString()
                };
            }

            try {
                const savedMedia = await findAnime.save();

                return {
                    mediaType: MediaType.ANIME,
                    message: "Votre modification sur la précédente demande de modification a bien été pris en compte.",
                    id: savedMedia.pubId
                };
            } catch (err: any) {
                console.error(err);
                return {
                    mediaType: MediaType.ANIME,
                    message: "Une erreur innatendu s'est produite.",
                    error: "Contactez le support si cette erreur ce repproduit a plusieurs reprise - S: editAnimeUpdateRequest"
                };
            }
        } catch (err: any) {
            console.error(err);
            return {
                mediaType: MediaType.ANIME,
                message: "Il y a un problème...",
                error: err.toString()
            };
        }
    }



    @Mutation(_ => MediaUpdateOutput, { description: "Faire une demande (d'ajout) d'un (nouvel) anime" })
    async addAnimeRequest(@Arg("data") dataInput: AnimeInput): Promise<MediaUpdateOutput> {
        try {
            const animeInput = await new AnimeInput()
                .init(dataInput);

            const media = new AnimeModel({
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
            }, { validateBeforeSave: true })

            try {
                await media.validate();
            } catch (err: any) {
                return {
                    mediaType: MediaType.ANIME,
                    message: "Les données saisies sont incorrectes.",
                    error: err.toString()
                };
            }

            try {
                const savedMedia = await media.save();

                return {
                    mediaType: MediaType.ANIME,
                    message: "Votre demande a bien été pris en compte.",
                    id: savedMedia.pubId
                };

            } catch (err: any) {
                return {
                    mediaType: MediaType.ANIME,
                    message: "Une erreur innatendu s'est produite.",
                    error: "Contactez le support si cette erreur ce repproduit a plusieurs reprise - S: addAnimeRequest"
                };
            }

        } catch (err: any) {
            console.error(err);
            return {
                mediaType: MediaType.ANIME,
                message: "Il y a un problème...",
                error: err.toString()
            };
        }
    }

    @Mutation(_ => MediaUpdateOutput, { description: "Faire une modification sur une demande de modification (existante)" })
    async editAnimeUpdateRequest(@Arg('animeId') id: number, @Arg('updateRequestId') versionId: number, @Arg("data") dataInput: AnimeInput): Promise<MediaUpdateOutput> {
        try {
            const findAnime = await AnimeModel.findOne({ id });

            if (!findAnime) {
                return {
                    mediaType: MediaType.ANIME,
                    message: "Une erreur s'est produite.",
                    error: "L'anime que vous voulez modifier n'existe pas.",
                };
            }

            if (!findAnime.updatesRequests) {
                return {
                    mediaType: MediaType.ANIME,
                    message: "Une erreur s'est produite.",
                    error: "Vous n'êtes pas autorisé.",
                }
            }

            const findVersion = findAnime.updatesRequests?.find(r => r.versionId === versionId);

            if (!findVersion) {
                return {
                    mediaType: MediaType.ANIME,
                    message: "Une erreur s'est produite.",
                    error: "La version que vous voulez modifier n'existe pas.",
                };
            }

            if (!findVersion.acceptNewUpdateFromAuthor) {
                return {
                    mediaType: MediaType.ANIME,
                    message: "Une erreur s'est produite.",
                    error: "Vous n'êtes pas autorisé.",
                };
            }


            // if (findVersion.author !== user.pubId) {
            //     return {
            //         mediaType: MediaType.ANIME,
            //         message: "Une erreur s'est produite.",
            //         error: "Vous n'êtes pas autorisé.",
            //     };
            // }


            const versionUpdate = await new AnimeInput().init(dataInput);

            findVersion.createdAt = new Date();
            findVersion.status = "NEW_UPDATE_FROM_AUTHOR";
            findVersion.data = {
                ...versionUpdate
            }

            findVersion.acceptNewUpdateFromAuthor = false;

            findAnime.updatesRequests = [
                findVersion,
                ...findAnime.updatesRequests.filter(u => u.versionId !== versionId)
            ]

            try {
                await findAnime.validate();
            } catch (err: any) {
                return {
                    mediaType: MediaType.ANIME,
                    message: "Les données saisies sont incorrectes.",
                    error: err.toString()
                };
            }

            try {
                const savedMedia = await findAnime.save();

                return {
                    mediaType: MediaType.ANIME,
                    message: "Votre modification sur la précédente demande de modification a bien été pris en compte.",
                    id: savedMedia.pubId
                };
            } catch (err: any) {
                console.error(err);
                return {
                    mediaType: MediaType.ANIME,
                    message: "Une erreur innatendu s'est produite.",
                    error: "Contactez le support si cette erreur ce repproduit a plusieurs reprise - S: editAnimeUpdateRequest"
                };
            }
        } catch (err: any) {
            console.error(err);
            return {
                mediaType: MediaType.ANIME,
                message: "Il y a un problème...",
                error: err.toString()
            };
        }
    }

    @Mutation(_ => MediaUpdateOutput, { description: "Faire une demande de (modification) sur un Anime (existant)" })
    async addAnimeUpdateRequest(@Arg('animeId') id: number, @Arg("data") dataInput: AnimeInput): Promise<MediaUpdateOutput> {
        try {
            const findAnime = await AnimeModel.findOne({ id });

            if (!findAnime) {
                return {
                    mediaType: MediaType.ANIME,
                    message: "Une erreur s'est produite.",
                    error: "L'anime que vous voulez modifier n'existe pas.",
                };
            }

            const animeInput = await new AnimeInput().init(dataInput);

            findAnime?.updatesRequests?.push({
                versionId: findAnime.updatesRequests.length + 1,
                data: animeInput,
                createdAt: new Date(),
                status: 'UNVERIFIED',
                acceptNewUpdateFromAuthor: false,
                author: 0
            })

            try {
                await findAnime.validate();
            } catch (err: any) {
                return {
                    mediaType: MediaType.ANIME,
                    message: "Les données saisies sont incorrectes.",
                    error: err.toString()
                };
            }

            try {
                const savedMedia = await findAnime.save();

                return {
                    mediaType: MediaType.ANIME,
                    message: "Votre demande de modification a bien été pris en compte.",
                    id: savedMedia.pubId
                };
            } catch (err: any) {
                console.error(err);
                return {
                    mediaType: MediaType.ANIME,
                    message: "Une erreur innatendu s'est produite.",
                    error: "Contactez le support si cette erreur ce repproduit a plusieurs reprise - S: addAnimeUpdateRequest"
                };
            }

        } catch (err: any) {
            console.error(err);
            return {
                mediaType: MediaType.ANIME,
                message: "Il y a un problème...",
                error: err.toString()
            };
        }
    }

}