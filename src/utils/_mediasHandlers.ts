// import { CharacterInit } from "../medias/characters/_character.util";
// import { CharacterRelationFields, CharacterInput } from "../medias/characters/_character.input";
// import { CharacterRelation, Character, CharacterModel } from "../medias/characters/_character.type";
// import { CompanyRelationFields, CompanyInput } from "../medias/companys/_company.input";
// import { CompanyRelation, Company, CompanyModel } from "../medias/companys/_company.type";
// import { PersonRelationFields, PersonInput } from "../medias/persons/_person.input";
// import { PersonRelation, Person, PersonModel } from "../medias/persons/_person.type";
// import { TrackRelationFields, TrackInput } from "../medias/tracks/_track.input";
// import { TrackRelation, Track, TrackModel } from "../medias/tracks/_track.type";
// import { ToSaveType } from "./_inputHandler";



// export class MediasHandler {
//     public dbMediaAction!: "request" | "direct_update";

//     constructor(action?: "request" | "direct_update") {
//         // super();
//         if (action) this.dbMediaAction = action;
//     }


//     public async handleCompanysGraphql(props?: CompanyRelationFields): Promise<CompanyRelation[] | undefined> {
//         if (!props?.news && !props?.exists) {
//             return;
//         }
//         // Handle new Person

//         let promisedAction: Promise<ToSaveType<Company>>[] = [];
//         console.log('action', this.dbMediaAction)
//         if (props.news)
//             for (let i = 0; i < props.news.length; i++) {
//                 const relationInput = props.news[i];
//                 const companyInput = new CompanyInput().init.bind(this)(relationInput.data, this.dbMediaAction);
//                 switch (this.dbMediaAction) {
//                     case 'request':
//                         promisedAction.push(
//                             companyInput.createRequest({
//                                 label: "Ajouter une société.",
//                                 action: "Demande de modification.",
//                                 field: {}
//                             })
//                         );
//                         break;
//                     case 'direct_update':
//                         promisedAction.push(
//                             companyInput.createUpdate({
//                                 public: relationInput.options?.setMediaPublic,
//                                 label: "Ajouter une société.",
//                                 action: "Modification.",
//                                 field: {
//                                     visible: relationInput.options?.setUpdatePublic,
//                                 }
//                             })
//                         );
//                         break;

//                     default:
//                         throw "Vous devez spécifié l'action."
//                 }

//             }

//         const updatesAndRequests = await Promise.all(promisedAction);

//         // Validation
//         await Promise.all(updatesAndRequests.map(({ model }) => model.validate()))

//         const checkExistCompanyRelation: Promise<CompanyRelation>[] = props.exists?.map(async (rel) => {
//             const company = await CompanyModel.findOne({ id: rel.id });
//             if (!company) throw `L'identifiant ${rel.id} n'existe pas.`;
//             return { data: company.id }
//         }) || []

//         const existPersonsIds: CompanyRelation[] = await Promise.all(checkExistCompanyRelation);
//         const newPersonsIds: CompanyRelation[] = updatesAndRequests.map(({ id, label }) => ({ data: id, label }));

//         const companyRelations = [...existPersonsIds, ...newPersonsIds];

//         return companyRelations;
//     }


//     public async handleCharactersGraphql(props?: CharacterRelationFields): Promise<CharacterRelation[] | undefined> {
//         if (!props?.news && !props?.exists) {
//             return undefined;
//         }

//         // Handle new Character

//         let promisedAction: Promise<ToSaveType<Character>>[] = [];

//         if (props.news)
//             for (let i = 0; i < props.news.length; i++) {
//                 const relationInput = props.news[i];
//                 const characterInput = await CharacterInit(relationInput.data, this.dbMediaAction);
//                 switch (this.dbMediaAction) {
//                     case 'request':
//                         promisedAction.push(
//                             characterInput.createRequest({
//                                 label: "Demande d'Ajout d'une personnage.",
//                                 action: "Demande de modification."
//                             })
//                         );
//                         break;
//                     case 'direct_update':
//                         promisedAction.push(
//                             characterInput.createUpdate({
//                                 public: relationInput.options?.setMediaPublic,
//                                 label: "Ajouter une personnage.",
//                                 action: "Modification.",
//                                 field: {
//                                     visible: relationInput.options?.setUpdatePublic,
//                                 }
//                             })
//                         );
//                         break;

//                     default:
//                         throw "Vous devez spécifié l'action."
//                 }

//             }

//         const updatesAndRequests = await Promise.all(promisedAction);

//         // Validation
//         await Promise.all(updatesAndRequests.map(({ model }) => model.validate()))

//         const checkExistCharacterRelation: Promise<CharacterRelation>[] = props.exists?.map(async (rel) => {
//             const character = await CharacterModel.findOne({ id: rel.id });
//             if (!character) throw `L'identifiant ${rel.id} n'existe pas.`;
//             return { data: character.id, label: rel.label }
//         }) || []

//         const existCharactersIds: CharacterRelation[] = await Promise.all(checkExistCharacterRelation);
//         const newCharactersIds: CharacterRelation[] = updatesAndRequests.map(({ id, label }) => ({ data: id, label }));

//         const characterRelations = [...existCharactersIds, ...newCharactersIds];

//         return characterRelations;
//     }



//     public async handleTracksGraphql(props?: TrackRelationFields): Promise<TrackRelation[] | undefined> {
//         if (!props?.news && !props?.exists) {
//             return undefined;
//         }

//         // Handle new Track

//         let promisedAction: Promise<ToSaveType<Track>>[] = [];

//         if (props.news)
//             for (let i = 0; i < props.news.length; i++) {
//                 const relationInput = props.news[i];
//                 const trackInput = await new TrackInput().init.bind(this)(relationInput.data, this.dbMediaAction);
//                 switch (this.dbMediaAction) {
//                     case 'request':
//                         promisedAction.push(
//                             trackInput.createRequest({
//                                 label: "Demande d'Ajout d'une musique.",
//                                 action: "Demande de modification."
//                             })
//                         );
//                         break;
//                     case 'direct_update':
//                         promisedAction.push(
//                             trackInput.createUpdate({
//                                 public: relationInput.options?.setMediaPublic,
//                                 label: "Ajouter une musique.",
//                                 action: "Modification.",
//                                 field: {
//                                     visible: relationInput.options?.setUpdatePublic,
//                                 }
//                             })
//                         );
//                         break;

//                     default:
//                         throw "Vous devez spécifié l'action."
//                 }

//             }

//         const updatesAndRequests = await Promise.all(promisedAction);

//         // Validation
//         await Promise.all(updatesAndRequests.map(({ model }) => model.validate()))

//         const checkExistTrackRelation: Promise<TrackRelation>[] = props.exists?.map(async (rel) => {
//             const track = await TrackModel.findOne({ id: rel.id });
//             if (!track) throw `L'identifiant ${rel.id} n'existe pas.`;
//             return { data: track.id, label: rel.label, episodes: rel.episodes }
//         }) || []

//         const existTracksIds: TrackRelation[] = await Promise.all(checkExistTrackRelation);
//         const newTracksIds: TrackRelation[] = updatesAndRequests.map(({ id, label }) => ({ data: id, label }));

//         const trackRelations = [...existTracksIds, ...newTracksIds];

//         return trackRelations;
//     }

//     public async handlePersonsGraphql(props?: PersonRelationFields): Promise<PersonRelation[] | undefined> {
//         if (!props?.news && !props?.exists) {
//             return undefined;
//         }

//         // Handle new Person
//         console.log('action person', this.dbMediaAction, props.news)
//         let promisedAction: Promise<ToSaveType<Person>>[] = [];

//         if (props.news)
//             for (let i = 0; i < props.news.length; i++) {
//                 const relationInput = props.news[i];
//                 const personInput = new PersonInput().init(relationInput.data, this.dbMediaAction);
//                 switch (this.dbMediaAction) {
//                     case 'request':
//                         promisedAction.push(
//                             personInput.createRequest({
//                                 label: "Demande d'Ajout d'une personne.",
//                                 action: "Demande de modification."
//                             })
//                         );
//                         break;
//                     case 'direct_update':
//                         promisedAction.push(
//                             personInput.createUpdate({
//                                 public: relationInput.options?.setMediaPublic,
//                                 label: "Ajouter une personne.",
//                                 action: "Modification.",
//                                 field: {
//                                     visible: relationInput.options?.setUpdatePublic,
//                                 }
//                             })
//                         );
//                         break;

//                     default:
//                         throw "Vous devez spécifié l'action."
//                 }

//             }

//         const updatesAndRequests = await Promise.all(promisedAction);

//         // Validation
//         await Promise.all(updatesAndRequests.map(({ model }) => model.validate()))

//         const checkExistPersonRelation: Promise<PersonRelation>[] = props.exists?.map(async (rel) => {
//             const person = await PersonModel.findOne({ id: rel.id });
//             if (!person) throw `L'identifiant ${rel.id} n'existe pas.`;
//             return { data: person.id, label: rel.label }
//         }) || []

//         const existPersonsIds: PersonRelation[] = await Promise.all(checkExistPersonRelation);
//         const newPersonsIds: PersonRelation[] = updatesAndRequests.map(({ id, label }) => ({ data: id, label }));

//         const personRelations = [...existPersonsIds, ...newPersonsIds];

//         return personRelations;
//     }
// }