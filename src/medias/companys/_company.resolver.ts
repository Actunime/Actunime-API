// import { Arg, Mutation, Query, Resolver } from "type-graphql";
// import { Company, CompanyMediaOutput, CompanyMediaPaginationOutput, CompanyModel, CompanyPaginationOutput, CompanySearchQuery } from "./_company.type";
// import { CompanyInput } from "./_company.input";
// import { Pagination } from "../../utils/_media.pagination";
// import { IMediaUpdates, MediaUpdateOptionArg, MediaUpdateOutput } from "../../utils/_media.update";
// import { MediaType } from "../../utils/_media.types";

// @Resolver(Company)
// export class CompanyResolver {

//     @Query(_return => Company, { nullable: true })
//     async getCompany(@Arg("id", () => String) id: string): Promise<Company | null> {

//         const findCompany = await CompanyModel.findOne({ id }).select('data id');

//         if (findCompany && findCompany.visible && findCompany.data) {

//             const { pubId: id, data } = findCompany;

//             return { id, ...data };

//         } else {
//             return null;
//         }

//     }

//     @Query(_returns => CompanyPaginationOutput, { nullable: true })
//     async searchCompanys(
//         @Arg("pagination", () => Pagination, { nullable: true }) pagination: Pagination | null,
//         @Arg("searchQuery", () => CompanySearchQuery, { nullable: true }) searchQuery: CompanySearchQuery | null
//     ): Promise<CompanyPaginationOutput> {
//         let currentPage = pagination?.page || 1;
//         let limitPerPage = pagination?.limit || 20;

//         // Mise en place query
//         let queryGen = CompanyModel.find({ data: { $ne: null } })

//         if (searchQuery) {

//             if (searchQuery.title)
//                 queryGen
//                     .searchMediaByTitle(searchQuery.title)

//         }

//         queryGen.select('pubId data');

//         // Mise en place pagination & résultats;

//         const generatedQuery = queryGen.getQuery();
//         const totalResults = await CompanyModel.countDocuments(generatedQuery);
//         const searchResult = await CompanyModel.find(generatedQuery)
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
//             results: searchResult.map((x) => ({ id: x.pubId, ...x.data as Company }))
//         };
//     }

//     @Query(_returns => CompanyMediaOutput, { nullable: true })
//     async getFullCompany(@Arg("id", () => Number) id: number): Promise<CompanyMediaOutput | null> {

//         const findCompany = await CompanyModel.findOne({ id });

//         if (findCompany) {

//             function sortByCreatedAt(a: IMediaUpdates<Company>, b: IMediaUpdates<Company>) {
//                 if (!b.createdAt || !a.createdAt) return 0;
//                 return b.createdAt.getTime() - a.createdAt.getTime()
//             }
//             const sortedUpdate = findCompany.updates.sort(sortByCreatedAt);
//             const sortedUpdateRequest = findCompany.requests.sort(sortByCreatedAt);

//             return {
//                 ...findCompany.toJSON(),
//                 data: findCompany.data,
//                 lastRequestDate: sortedUpdateRequest[0].createdAt,
//                 lastUpdateDate: sortedUpdate[0].createdAt
//             }

//         } else {
//             return null;
//         }
//     }

//     @Query(_returns => [CompanyMediaPaginationOutput], { nullable: true })
//     async searchFullCompany(
//         @Arg("pagination", () => Pagination, { nullable: true }) pagination: Pagination | null,
//         @Arg("searchQuery", () => CompanySearchQuery, { nullable: true }) searchQuery: CompanySearchQuery | null
//     ): Promise<CompanyMediaPaginationOutput> {

//         let currentPage = pagination?.page || 1;
//         let limitPerPage = pagination?.limit || 20;

//         // Mise en place query
//         let queryGen = CompanyModel.find()

//         if (searchQuery) {

//             if (searchQuery.title)
//                 queryGen
//                     .searchMediaByTitle(searchQuery.title)

//         }

//         // Mise en place pagination & résultats;

//         const generatedQuery = queryGen.getQuery();
//         const totalResults = await CompanyModel.countDocuments(generatedQuery);
//         const searchResult = await CompanyModel.find(generatedQuery)
//             .skip(limitPerPage * (currentPage - 1))
//             .limit(limitPerPage);

//         const totalPage = Math.round(totalResults / limitPerPage) < 1 ? 1 : Math.round(totalResults / limitPerPage);

//         console.log('result', searchResult.map((x) => x.toJSON()))

//         function sortByCreatedAt(a: IMediaUpdates<Company>, b: IMediaUpdates<Company>) {
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

//     @Mutation(_ => MediaUpdateOutput, { description: "Ajouter une Company" })
//     async createCompany(
//         @Arg("data", _ => CompanyInput) dataInput: CompanyInput,
//         @Arg("options", _ => MediaUpdateOptionArg) options: MediaUpdateOptionArg
//     )
//         : Promise<MediaUpdateOutput> {

//         const author = undefined;

//         const companyInput = await new CompanyInput().init(dataInput, "direct_update");

//         const update = await companyInput.createUpdate({
//             label: "Company",
//             action: "Création d'un Company",
//             field: { author, moderator: author, visible: options.setUpdatePublic }
//         });

//         await update.model.validate();

//         // Validation
//         await Promise.all(companyInput.mediasToSave.map(({ model }) => {
//             return model.save({ validateBeforeSave: false });
//         }))

//         return {
//             mediaType: MediaType.COMPANY,
//             message: "Company a bien été crée.",
//             pubId: update.model.pubId
//         }
//     }


//     @Mutation(_ => MediaUpdateOutput, { description: "Demande d'ajout Company" })
//     async createCompanyRequest(
//         @Arg("data", _ => CompanyInput) dataInput: CompanyInput,
//         // @Arg("options", _ => MediaUpdateOptionArg) options: MediaUpdateOptionArg
//     ): Promise<MediaUpdateOutput> {

//         const author = undefined;

//         const companyInput = await new CompanyInput().init(dataInput, "request");

//         const request = await companyInput.createRequest({
//             label: "Company",
//             action: "Demande d'ajout Company",
//             field: { author, moderator: author }
//         });

//         await request.model.validate();

//         // Validation
//         await Promise.all(companyInput.mediasToSave.map(({ model }) => {
//             return model.save({ validateBeforeSave: false });
//         }))

//         return {
//             mediaType: MediaType.COMPANY,
//             message: "La demande a bien été crée.",
//             pubId: request.model.pubId
//         }
//     }

//     @Mutation(_ => MediaUpdateOutput, { description: "Modification d'un Company" })
//     async updateCompany(
//         @Arg('companyToUpdate') mediaToUpdate: string,
//         @Arg('versionToUpdate', { nullable: true, description: "Modifier une précédente modification" }) versionToUpdate: number,
//         @Arg("data", _ => CompanyInput) dataInput: CompanyInput,
//         @Arg("options", _ => MediaUpdateOptionArg) options: MediaUpdateOptionArg
//     ): Promise<MediaUpdateOutput> {

//         const author = undefined;

//         const companyInput = await new CompanyInput().init(dataInput, "direct_update");

//         const update = await companyInput.createUpdate({
//             mediaToUpdate,
//             versionToUpdate,
//             public: options.setMediaPublic,
//             label: "Company",
//             action: "Modification d'un Company",
//             field: {
//                 author,
//                 moderator: author,
//                 visible: options.setUpdatePublic
//             }
//         });

//         await update.model.validate();

//         // Validation
//         await Promise.all(companyInput.mediasToSave.map(({ model }) => {
//             return model.save({ validateBeforeSave: false });
//         }))

//         return {
//             mediaType: MediaType.COMPANY,
//             message: "Company a bien été crée.",
//             pubId: update.model.pubId
//         }
//     }



//     @Mutation(_ => MediaUpdateOutput, { description: "Demande de Modification d'un Company" })
//     async requestCompanyUpdate(
//         @Arg('companyToUpdate') mediaToUpdate: string,
//         @Arg('versionToUpdate', { nullable: true, description: "Modifier une précédente modification" }) versionToUpdate: number,
//         @Arg("data", _ => CompanyInput) dataInput: CompanyInput,
//         @Arg("options", _ => MediaUpdateOptionArg) options: MediaUpdateOptionArg
//     ): Promise<MediaUpdateOutput> {

//         const author = undefined;

//         const companyInput = await new CompanyInput().init(dataInput, "request");

//         const request = await companyInput.createRequest({
//             mediaToUpdate,
//             versionToUpdate,
//             public: options.setMediaPublic,
//             label: "Company",
//             action: "Demande de Modification d'un Company",
//             field: {
//                 author,
//                 moderator: author,
//                 visible: options.setUpdatePublic
//             }
//         });

//         await request.model.validate();

//         // Validation
//         await Promise.all(companyInput.mediasToSave.map(({ model }) => {
//             return model.save({ validateBeforeSave: false });
//         }))

//         return {
//             mediaType: MediaType.COMPANY,
//             message: "La Company a bien été crée.",
//             pubId: request.model.pubId
//         }
//     }
// }