// import { Arg, Mutation, Query, Resolver } from "type-graphql";
// import { Character, CharacterMediaOutput, CharacterMediaPaginationOutput, CharacterModel, CharacterPaginationOutput, CharacterSearchQuery } from "./_character.type";
// import { CharacterInput } from "./_character.input";
// import { Pagination } from "../../utils/_media.pagination";
// import { IMediaUpdates, MediaUpdateOptionArg, MediaUpdateOutput } from "../../utils/_media.update";
// import { MediaType } from "../../utils/_media.types";

// @Resolver(Character)
// export class CharacterResolver {

//     @Query(_return => Character, { nullable: true })
//     async getCharacter(@Arg("id", () => String) id: string): Promise<Character | null> {

//         const findCharacter = await CharacterModel.findOne({ id }).select('data id');

//         if (findCharacter && findCharacter.visible && findCharacter.data) {

//             const { pubId: id, data } = findCharacter;

//             return { id, ...data };

//         } else {
//             return null;
//         }

//     }

//     @Query(_returns => CharacterPaginationOutput, { nullable: true })
//     async searchCharacters(
//         @Arg("pagination", () => Pagination, { nullable: true }) pagination: Pagination | null,
//         @Arg("searchQuery", () => CharacterSearchQuery, { nullable: true }) searchQuery: CharacterSearchQuery | null
//     ): Promise<CharacterPaginationOutput> {
//         let currentPage = pagination?.page || 1;
//         let limitPerPage = pagination?.limit || 20;

//         // Mise en place query
//         let queryGen = CharacterModel.find({ data: { $ne: null } })

//         if (searchQuery) {

//             if (searchQuery.title)
//                 queryGen
//                     .searchMediaByTitle(searchQuery.title)

//         }

//         queryGen.select('pubId data');

//         // Mise en place pagination & résultats;

//         const generatedQuery = queryGen.getQuery();
//         const totalResults = await CharacterModel.countDocuments(generatedQuery);
//         const searchResult = await CharacterModel.find(generatedQuery)
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
//             results: searchResult.map((x) => ({ id: x.pubId, ...x.data as Character }))
//         };
//     }

//     @Query(_returns => CharacterMediaOutput, { nullable: true })
//     async getFullCharacter(@Arg("id", () => Number) id: number): Promise<CharacterMediaOutput | null> {

//         const findCharacter = await CharacterModel.findOne({ id });

//         if (findCharacter) {

//             function sortByCreatedAt(a: IMediaUpdates<Character>, b: IMediaUpdates<Character>) {
//                 if (!b.createdAt || !a.createdAt) return 0;
//                 return b.createdAt.getTime() - a.createdAt.getTime()
//             }

//             const sortedUpdate = findCharacter.updates.sort(sortByCreatedAt);
//             const sortedUpdateRequest = findCharacter.requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

//             return {
//                 ...findCharacter.toJSON(),
//                 data: findCharacter.data,
//                 lastRequestDate: sortedUpdateRequest[0].createdAt,
//                 lastUpdateDate: sortedUpdate[0].createdAt
//             }

//         } else {
//             return null;
//         }
//     }

//     @Query(_returns => [CharacterMediaPaginationOutput], { nullable: true })
//     async searchFullCharacter(
//         @Arg("pagination", () => Pagination, { nullable: true }) pagination: Pagination | null,
//         @Arg("searchQuery", () => CharacterSearchQuery, { nullable: true }) searchQuery: CharacterSearchQuery | null
//     ): Promise<CharacterMediaPaginationOutput> {

//         let currentPage = pagination?.page || 1;
//         let limitPerPage = pagination?.limit || 20;

//         // Mise en place query
//         let queryGen = CharacterModel.find()

//         if (searchQuery) {

//             if (searchQuery.title)
//                 queryGen
//                     .searchMediaByTitle(searchQuery.title)

//         }

//         // Mise en place pagination & résultats;

//         const generatedQuery = queryGen.getQuery();
//         const totalResults = await CharacterModel.countDocuments(generatedQuery);
//         const searchResult = await CharacterModel.find(generatedQuery)
//             .skip(limitPerPage * (currentPage - 1))
//             .limit(limitPerPage);

//         const totalPage = Math.round(totalResults / limitPerPage) < 1 ? 1 : Math.round(totalResults / limitPerPage);

//         console.log('result', searchResult.map((x) => x.toJSON()))

//         function sortByCreatedAt(a: IMediaUpdates<Character>, b: IMediaUpdates<Character>) {
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

//     @Mutation(_ => MediaUpdateOutput, { description: "Ajouter un nouveau Character" })
//     async createCharacter(
//         @Arg("data", _ => CharacterInput) dataInput: CharacterInput,
//         @Arg("options", _ => MediaUpdateOptionArg) options: MediaUpdateOptionArg
//     )
//         : Promise<MediaUpdateOutput> {

//         const author = undefined;

//         const characterInput = await new CharacterInput().init(dataInput, "direct_update");

//         const update = await characterInput.createUpdate({
//             label: "Character",
//             action: "Création d'un Character",
//             field: { author, moderator: author, visible: options.setUpdatePublic }
//         });

//         await update.model.validate();

//         // Validation
//         await Promise.all(characterInput.mediasToSave.map(({ model }) => {
//             return model.save({ validateBeforeSave: false });
//         }))

//         return {
//             mediaType: MediaType.CHARACTER,
//             message: "Character a bien été crée.",
//             pubId: update.model.pubId
//         }
//     }


//     @Mutation(_ => MediaUpdateOutput, { description: "Demande d'ajout d'un nouveau Character" })
//     async createCharacterRequest(
//         @Arg("data", _ => CharacterInput) dataInput: CharacterInput,
//         @Arg("options", _ => MediaUpdateOptionArg) options: MediaUpdateOptionArg
//     ): Promise<MediaUpdateOutput> {

//         const author = undefined;

//         const characterInput = await new CharacterInput().init(dataInput, "request");

//         const request = await characterInput.createRequest({
//             label: "Character",
//             action: "Demande d'ajout d'un Character",
//             field: { author, moderator: author, visible: options.setUpdatePublic }
//         });

//         await request.model.validate();

//         // Validation
//         await Promise.all(characterInput.mediasToSave.map(({ model }) => {
//             return model.save({ validateBeforeSave: false });
//         }))

//         return {
//             mediaType: MediaType.CHARACTER,
//             message: "La demande a bien été crée.",
//             pubId: request.model.pubId
//         }
//     }

//     @Mutation(_ => MediaUpdateOutput, { description: "Modification d'un Character" })
//     async updateCharacter(
//         @Arg('characterToUpdate') mediaToUpdate: string,
//         @Arg('versionToUpdate', { nullable: true, description: "Modifier une précédente modification" }) versionToUpdate: number,
//         @Arg("data", _ => CharacterInput) dataInput: CharacterInput,
//         @Arg("options", _ => MediaUpdateOptionArg) options: MediaUpdateOptionArg
//     ): Promise<MediaUpdateOutput> {

//         const author = undefined;

//         const characterInput = await new CharacterInput().init(dataInput, "direct_update");

//         const update = await characterInput.createUpdate({
//             mediaToUpdate,
//             versionToUpdate,
//             public: options.setMediaPublic,
//             label: "Character",
//             action: "Modification d'un Character",
//             field: {
//                 author,
//                 moderator: author,
//                 visible: options.setUpdatePublic
//             }
//         });

//         await update.model.validate();

//         // Validation
//         await Promise.all(characterInput.mediasToSave.map(({ model }) => {
//             return model.save({ validateBeforeSave: false });
//         }))

//         return {
//             mediaType: MediaType.CHARACTER,
//             message: "Character a bien été crée.",
//             pubId: update.model.pubId
//         }
//     }



//     @Mutation(_ => MediaUpdateOutput, { description: "Demande de Modification d'un Character" })
//     async requestCharacterUpdate(
//         @Arg('characterToUpdate') mediaToUpdate: string,
//         @Arg('versionToUpdate', { nullable: true, description: "Modifier une précédente modification" }) versionToUpdate: number,
//         @Arg("data", _ => CharacterInput) dataInput: CharacterInput,
//         @Arg("options", _ => MediaUpdateOptionArg) options: MediaUpdateOptionArg
//     ): Promise<MediaUpdateOutput> {

//         const author = undefined;

//         const characterInput = await new CharacterInput().init(dataInput, "request");

//         const request = await characterInput.createRequest({
//             mediaToUpdate,
//             versionToUpdate,
//             public: options.setMediaPublic,
//             label: "Character",
//             action: "Demande de Modification d'un Character",
//             field: {
//                 author,
//                 moderator: author,
//                 visible: options.setUpdatePublic
//             }
//         });

//         await request.model.validate();

//         // Validation
//         await Promise.all(characterInput.mediasToSave.map(({ model }) => {
//             return model.save({ validateBeforeSave: false });
//         }))

//         return {
//             mediaType: MediaType.CHARACTER,
//             message: "Character a bien été crée.",
//             pubId: request.model.pubId
//         }
//     }
// }