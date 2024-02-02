// import { Arg, Mutation, Query, Resolver } from "type-graphql";
// import { Track, TrackMediaOutput, TrackMediaPaginationOutput, TrackModel, TrackPaginationOutput, TrackSearchQuery } from "./_track.type";
// import { TrackInput } from "./_track.input";
// import { Pagination } from "../../utils/_media.pagination";
// import { IMediaUpdates, MediaUpdateOptionArg, MediaUpdateOutput } from "../../utils/_media.update";
// import { MediaType } from "../../utils/_media.types";

// @Resolver(Track)
// export class TrackResolver {

//     @Query(_return => Track, { nullable: true })
//     async getTrack(@Arg("id", () => String) id: string): Promise<Track | null> {

//         const findTrack = await TrackModel.findOne({ id }).select('data id');

//         if (findTrack && findTrack.visible && findTrack.data) {

//             const { pubId: id, data } = findTrack;

//             return { id, ...data };

//         } else {
//             return null;
//         }

//     }

//     @Query(_returns => TrackPaginationOutput, { nullable: true })
//     async searchTracks(
//         @Arg("pagination", () => Pagination, { nullable: true }) pagination: Pagination | null,
//         @Arg("searchQuery", () => TrackSearchQuery, { nullable: true }) searchQuery: TrackSearchQuery | null
//     ): Promise<TrackPaginationOutput> {
//         let currentPage = pagination?.page || 1;
//         let limitPerPage = pagination?.limit || 20;

//         // Mise en place query
//         let queryGen = TrackModel.find({ data: { $ne: null } })

//         if (searchQuery) {

//             if (searchQuery.title)
//                 queryGen
//                     .searchMediaByTitle(searchQuery.title)

//         }

//         queryGen.select('pubId data');

//         // Mise en place pagination & résultats;

//         const generatedQuery = queryGen.getQuery();
//         const totalResults = await TrackModel.countDocuments(generatedQuery);
//         const searchResult = await TrackModel.find(generatedQuery)
//             .skip(limitPerPage * (currentPage - 1))
//             .limit(limitPerPage);

//         const totalPage = Math.round(totalResults / limitPerPage) < 1 ? 1 : Math.round(totalResults / limitPerPage);

//         console.log('result', searchResult.map((x) => x.toJSON()))
//         return {
//             currentPage,
//             totalPage,
//             limitPerPage,
//             totalResults,
//             hasNextPage: currentPage < totalPage,
//             hasPrevPage: currentPage >= 1 && currentPage < totalPage,
//             results: searchResult.map((x) => ({ id: x.pubId, ...x.data as Track }))
//         };
//     }

//     @Query(_returns => TrackMediaOutput, { nullable: true })
//     async getFullTrack(@Arg("id", () => Number) id: number): Promise<TrackMediaOutput | null> {

//         const findTrack = await TrackModel.findOne({ id });

//         if (findTrack) {

//             function sortByCreatedAt(a: IMediaUpdates<Track>, b: IMediaUpdates<Track>) {
//                 if (!b.createdAt || !a.createdAt) return 0;
//                 return b.createdAt.getTime() - a.createdAt.getTime()
//             }

//             const sortedUpdate = findTrack.updates.sort(sortByCreatedAt);
//             const sortedUpdateRequest = findTrack.requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

//             return {
//                 ...findTrack.toJSON(),
//                 data: findTrack.data,
//                 lastRequestDate: sortedUpdateRequest[0].createdAt,
//                 lastUpdateDate: sortedUpdate[0].createdAt
//             }

//         } else {
//             return null;
//         }
//     }

//     @Query(_returns => [TrackMediaPaginationOutput], { nullable: true })
//     async searchFullTrack(
//         @Arg("pagination", () => Pagination, { nullable: true }) pagination: Pagination | null,
//         @Arg("searchQuery", () => TrackSearchQuery, { nullable: true }) searchQuery: TrackSearchQuery | null
//     ): Promise<TrackMediaPaginationOutput> {

//         let currentPage = pagination?.page || 1;
//         let limitPerPage = pagination?.limit || 20;

//         // Mise en place query
//         let queryGen = TrackModel.find()

//         if (searchQuery) {

//             if (searchQuery.title)
//                 queryGen
//                     .searchMediaByTitle(searchQuery.title)

//         }

//         // Mise en place pagination & résultats;

//         const generatedQuery = queryGen.getQuery();
//         const totalResults = await TrackModel.countDocuments(generatedQuery);
//         const searchResult = await TrackModel.find(generatedQuery)
//             .skip(limitPerPage * (currentPage - 1))
//             .limit(limitPerPage);

//         const totalPage = Math.round(totalResults / limitPerPage) < 1 ? 1 : Math.round(totalResults / limitPerPage);

//         console.log('result', searchResult.map((x) => x.toJSON()))

//         function sortByCreatedAt(a: IMediaUpdates<Track>, b: IMediaUpdates<Track>) {
//             if (!b.createdAt || !a.createdAt) return 0;
//             return b.createdAt.getTime() - a.createdAt.getTime()
//         }

//         return {
//             currentPage,
//             totalPage,
//             limitPerPage,
//             totalResults,
//             hasNextPage: currentPage < totalPage,
//             hasPrevPage: currentPage >= 1 && currentPage < totalPage,
//             results: searchResult.map((animeMedia) => {
//                 const sortedUpdate = animeMedia.updates.sort(sortByCreatedAt);
//                 const sortedUpdateRequest = animeMedia.requests.sort(sortByCreatedAt);
//                 return {
//                     ...animeMedia.toJSON(),
//                     lastRequestDate: sortedUpdateRequest[0].createdAt,
//                     lastUpdateDate: sortedUpdate[0].createdAt
//                 }
//             })
//         };
//     }

//     @Mutation(_ => MediaUpdateOutput, { description: "Ajouter un nouveau Track" })
//     async createTrack(
//         @Arg("data", _ => TrackInput) dataInput: TrackInput,
//         @Arg("options", _ => MediaUpdateOptionArg) options: MediaUpdateOptionArg
//     )
//         : Promise<MediaUpdateOutput> {

//         const author = undefined;

//         const trackInput = await new TrackInput().init(dataInput, "direct_update");

//         const update = await trackInput.createUpdate({
//             label: "Track",
//             action: "Création d'un Track",
//             field: { author, moderator: author, visible: options.setUpdatePublic }
//         });

//         await update.model.validate();

//         // Validation
//         await Promise.all(trackInput.mediasToSave.map(({ model }) => {
//             return model.save({ validateBeforeSave: false });
//         }))

//         return {
//             mediaType: MediaType.TRACK,
//             message: "Track a bien été crée.",
//             pubId: update.model.pubId
//         }
//     }


//     @Mutation(_ => MediaUpdateOutput, { description: "Demande d'ajout d'un nouveau Track" })
//     async createTrackRequest(
//         @Arg("data", _ => TrackInput) dataInput: TrackInput,
//         @Arg("options", _ => MediaUpdateOptionArg) options: MediaUpdateOptionArg
//     ): Promise<MediaUpdateOutput> {

//         const author = undefined;

//         const trackInput = await new TrackInput().init(dataInput, "request");

//         const request = await trackInput.createRequest({
//             label: "Track",
//             action: "Demande d'ajout d'un Track",
//             field: { author, moderator: author, visible: options.setUpdatePublic }
//         });

//         await request.model.validate();

//         // Validation
//         await Promise.all(trackInput.mediasToSave.map(({ model }) => {
//             return model.save({ validateBeforeSave: false });
//         }))

//         return {
//             mediaType: MediaType.TRACK,
//             message: "La demande a bien été crée.",
//             pubId: request.model.pubId
//         }
//     }

//     @Mutation(_ => MediaUpdateOutput, { description: "Modification d'un Track" })
//     async updateTrack(
//         @Arg('trackToUpdate') mediaToUpdate: string,
//         @Arg('versionToUpdate', { nullable: true, description: "Modifier une précédente modification" }) versionToUpdate: number,
//         @Arg("data", _ => TrackInput) dataInput: TrackInput,
//         @Arg("options", _ => MediaUpdateOptionArg) options: MediaUpdateOptionArg
//     ): Promise<MediaUpdateOutput> {

//         const author = undefined;

//         const trackInput = await new TrackInput().init(dataInput, "direct_update");

//         const update = await trackInput.createUpdate({
//             mediaToUpdate,
//             versionToUpdate,
//             public: options.setMediaPublic,
//             label: "Track",
//             action: "Modification d'un Track",
//             field: {
//                 author,
//                 moderator: author,
//                 visible: options.setUpdatePublic
//             }
//         });

//         await update.model.validate();

//         // Validation
//         await Promise.all(trackInput.mediasToSave.map(({ model }) => {
//             return model.save({ validateBeforeSave: false });
//         }))

//         return {
//             mediaType: MediaType.TRACK,
//             message: "Track a bien été crée.",
//             pubId: update.model.pubId
//         }
//     }



//     @Mutation(_ => MediaUpdateOutput, { description: "Demande de Modification d'un Track" })
//     async requestTrackUpdate(
//         @Arg('trackToUpdate') mediaToUpdate: string,
//         @Arg('versionToUpdate', { nullable: true, description: "Modifier une précédente modification" }) versionToUpdate: number,
//         @Arg("data", _ => TrackInput) dataInput: TrackInput,
//         @Arg("options", _ => MediaUpdateOptionArg) options: MediaUpdateOptionArg
//     ): Promise<MediaUpdateOutput> {

//         const author = undefined;

//         const trackInput = await new TrackInput().init(dataInput, "request");

//         const request = await trackInput.createRequest({
//             mediaToUpdate,
//             versionToUpdate,
//             public: options.setMediaPublic,
//             label: "Track",
//             action: "Demande de Modification d'un Track",
//             field: {
//                 author,
//                 moderator: author,
//                 visible: options.setUpdatePublic
//             }
//         });

//         await request.model.validate();

//         // Validation
//         await Promise.all(trackInput.mediasToSave.map(({ model }) => {
//             return model.save({ validateBeforeSave: false });
//         }))

//         return {
//             mediaType: MediaType.TRACK,
//             message: "Track a bien été crée.",
//             pubId: request.model.pubId
//         }
//     }
// }