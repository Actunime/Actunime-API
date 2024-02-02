// import { Arg, Mutation, Query, Resolver } from "type-graphql";
// import { Person, PersonMediaOutput, PersonMediaPaginationOutput, PersonModel, PersonPaginationOutput } from "./_person.type";
// import { PersonInput, PersonSearchQuery } from "./_person.input";
// import { Pagination } from "../../utils/_media.pagination";
// import { IMediaUpdates, MediaUpdateOptionArg, MediaUpdateOutput } from "../../utils/_media.update";
// import { MediaType } from "../../utils/_media.types";

// @Resolver(Person)
// export class PersonResolver {

//     @Query(_return => Person, { nullable: true })
//     async getPerson(@Arg("id", () => String) id: string): Promise<Person | null> {

//         const findPerson = await PersonModel.findOne({ id }).select('data id');

//         if (findPerson && findPerson.visible && findPerson.data) {

//             const { pubId: id, data } = findPerson;

//             return { id, ...data };

//         } else {
//             return null;
//         }

//     }

//     @Query(_returns => PersonPaginationOutput, { nullable: true })
//     async searchPersons(
//         @Arg("pagination", () => Pagination, { nullable: true }) pagination: Pagination | null,
//         @Arg("searchQuery", () => PersonSearchQuery, { nullable: true }) searchQuery: PersonSearchQuery | null
//     ): Promise<PersonPaginationOutput> {
//         let currentPage = pagination?.page || 1;
//         let limitPerPage = pagination?.limit || 20;

//         // Mise en place query
//         let queryGen = PersonModel.find({ data: { $ne: null } })

//         if (searchQuery) {

//             if (searchQuery.title)
//                 queryGen
//                     .searchMediaByTitle(searchQuery.title)

//         }

//         queryGen.select('pubId data');

//         // Mise en place pagination & résultats;

//         const generatedQuery = queryGen.getQuery();
//         const totalResults = await PersonModel.countDocuments(generatedQuery);
//         const searchResult = await PersonModel.find(generatedQuery)
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
//             results: searchResult.map((x) => ({ id: x.pubId, ...x.data as Person }))
//         };
//     }

//     @Query(_returns => PersonMediaOutput, { nullable: true })
//     async getFullPerson(@Arg("id", () => Number) id: number): Promise<PersonMediaOutput | null> {

//         const findPerson = await PersonModel.findOne({ id });

//         if (findPerson) {

//             function sortByCreatedAt(a: IMediaUpdates<Person>, b: IMediaUpdates<Person>) {
//                 if (!b.createdAt || !a.createdAt) return 0;
//                 return b.createdAt.getTime() - a.createdAt.getTime()
//             }
//             const sortedUpdate = findPerson.updates.sort(sortByCreatedAt);
//             const sortedUpdateRequest = findPerson.requests.sort(sortByCreatedAt);

//             return {
//                 ...findPerson.toJSON(),
//                 data: findPerson.data,
//                 lastRequestDate: sortedUpdateRequest[0].createdAt,
//                 lastUpdateDate: sortedUpdate[0].createdAt
//             }

//         } else {
//             return null;
//         }
//     }

//     @Query(_returns => [PersonMediaPaginationOutput], { nullable: true })
//     async searchFullPerson(
//         @Arg("pagination", () => Pagination, { nullable: true }) pagination: Pagination | null,
//         @Arg("searchQuery", () => PersonSearchQuery, { nullable: true }) searchQuery: PersonSearchQuery | null
//     ): Promise<PersonMediaPaginationOutput> {

//         let currentPage = pagination?.page || 1;
//         let limitPerPage = pagination?.limit || 20;

//         // Mise en place query
//         let queryGen = PersonModel.find()

//         if (searchQuery) {

//             if (searchQuery.title)
//                 queryGen
//                     .searchMediaByTitle(searchQuery.title)

//         }

//         // Mise en place pagination & résultats;

//         const generatedQuery = queryGen.getQuery();
//         const totalResults = await PersonModel.countDocuments(generatedQuery);
//         const searchResult = await PersonModel.find(generatedQuery)
//             .skip(limitPerPage * (currentPage - 1))
//             .limit(limitPerPage);

//         const totalPage = Math.round(totalResults / limitPerPage) < 1 ? 1 : Math.round(totalResults / limitPerPage);

//         console.log('result', searchResult.map((x) => x.toJSON()))

//         function sortByCreatedAt(a: IMediaUpdates<Person>, b: IMediaUpdates<Person>) {
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

//     @Mutation(_ => MediaUpdateOutput, { description: "Ajouter un nouveau Person" })
//     async createPerson(
//         @Arg("data", _ => PersonInput) dataInput: PersonInput,
//         @Arg("options", _ => MediaUpdateOptionArg) options: MediaUpdateOptionArg
//     )
//         : Promise<MediaUpdateOutput> {

//         const author = undefined;

//         const personInput = await new PersonInput().init(dataInput, "direct_update");

//         const update = await personInput.createUpdate({
//             label: "Person",
//             action: "Création d'un Person",
//             field: { author, moderator: author, visible: options.setUpdatePublic }
//         });

//         await update.model.validate();

//         // Validation
//         await Promise.all(personInput.mediasToSave.map(({ model }) => {
//             return model.save({ validateBeforeSave: false });
//         }))

//         return {
//             mediaType: MediaType.CHARACTER,
//             message: "Person a bien été crée.",
//             pubId: update.model.pubId
//         }
//     }


//     @Mutation(_ => MediaUpdateOutput, { description: "Demande d'ajout d'un nouveau Person" })
//     async createPersonRequest(
//         @Arg("data", _ => PersonInput) dataInput: PersonInput,
//         @Arg("options", _ => MediaUpdateOptionArg) options: MediaUpdateOptionArg
//     ): Promise<MediaUpdateOutput> {

//         const author = undefined;

//         const personInput = await new PersonInput().init(dataInput, "request");

//         const request = await personInput.createRequest({
//             label: "Person",
//             action: "Demande d'ajout d'un Person",
//             field: { author, moderator: author, visible: options.setUpdatePublic }
//         });

//         await request.model.validate();

//         // Validation
//         await Promise.all(personInput.mediasToSave.map(({ model }) => {
//             return model.save({ validateBeforeSave: false });
//         }))

//         return {
//             mediaType: MediaType.CHARACTER,
//             message: "La demande a bien été crée.",
//             pubId: request.model.pubId
//         }
//     }

//     @Mutation(_ => MediaUpdateOutput, { description: "Modification d'un Person" })
//     async updatePerson(
//         @Arg('personToUpdate') mediaToUpdate: string,
//         @Arg('versionToUpdate', { nullable: true, description: "Modifier une précédente modification" }) versionToUpdate: number,
//         @Arg("data", _ => PersonInput) dataInput: PersonInput,
//         @Arg("options", _ => MediaUpdateOptionArg) options: MediaUpdateOptionArg
//     ): Promise<MediaUpdateOutput> {

//         const author = undefined;

//         const personInput = await new PersonInput().init(dataInput, "direct_update");

//         const update = await personInput.createUpdate({
//             mediaToUpdate,
//             versionToUpdate,
//             public: options.setMediaPublic,
//             label: "Person",
//             action: "Modification d'un Person",
//             field: {
//                 author,
//                 moderator: author,
//                 visible: options.setUpdatePublic
//             }
//         });

//         await update.model.validate();

//         // Validation
//         await Promise.all(personInput.mediasToSave.map(({ model }) => {
//             return model.save({ validateBeforeSave: false });
//         }))

//         return {
//             mediaType: MediaType.CHARACTER,
//             message: "Person a bien été crée.",
//             pubId: update.model.pubId
//         }
//     }



//     @Mutation(_ => MediaUpdateOutput, { description: "Demande de Modification d'un Person" })
//     async requestPersonUpdate(
//         @Arg('personToUpdate') mediaToUpdate: string,
//         @Arg('versionToUpdate', { nullable: true, description: "Modifier une précédente modification" }) versionToUpdate: number,
//         @Arg("data", _ => PersonInput) dataInput: PersonInput,
//         @Arg("options", _ => MediaUpdateOptionArg) options: MediaUpdateOptionArg
//     ): Promise<MediaUpdateOutput> {

//         const author = undefined;

//         const personInput = await new PersonInput().init(dataInput, "request");

//         const request = await personInput.createRequest({
//             mediaToUpdate,
//             versionToUpdate,
//             public: options.setMediaPublic,
//             label: "Person",
//             action: "Demande de Modification d'un Person",
//             field: {
//                 author,
//                 moderator: author,
//                 visible: options.setUpdatePublic
//             }
//         });

//         await request.model.validate();

//         // Validation
//         await Promise.all(personInput.mediasToSave.map(({ model }) => {
//             return model.save({ validateBeforeSave: false });
//         }))

//         return {
//             mediaType: MediaType.CHARACTER,
//             message: "Person a bien été crée.",
//             pubId: request.model.pubId
//         }
//     }
// }