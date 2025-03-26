// import { FastifyRequest } from 'fastify';
// import { APIResponse } from '../../_utils/_response';
// import {
//   IPersonCreateBody,
//   IPersonPaginationBody,
//   IMediaDeleteBody,
//   IMediaVerifyBody,
//   IPatchPaginationBody,
// } from '@actunime/validations';
// import { PersonHandlers } from '../person.handlers';
// import { IPerson } from '@actunime/types';
// import { PersonEqualTEST } from './media.base.test';
// import { Person } from '../../_lib/media/_person';
// import test, { TestContext } from 'node:test';
// import { Patch } from '../../_lib/media';

// /** Récupérer un person a partir de son identifiant */
// const getPerson = async (req: FastifyRequest<{ Params: { id: string } }>) => {
//   const handler = await PersonHandlers.getPerson(req);
//   const data = handler.data;
//   if (data) {
//     await test("Vérifier si l'person retourné est égale a l'person dans la base de donnée", async (t) => {
//       const old = new Person(data);
//       const { changes } = await old.getDBDiff();
//       if (changes && changes.length)
//         return t.assert.fail(
//           `${changes.length} changements ont été détecté c'est pas normal !`
//         );
//     });
//   } else {
//     await test(`Il n'y a pas de données pour l'person ${req.params.id}`, async (t) => {
//       const getPerson = await Person.get(req.params.id);
//       if (getPerson)
//         return t.assert.fail(
//           `Il n'a pas de données pour l'person ${req.params.id} alors qu'il existe bien !`
//         );
//     });
//   }
//   return { ...handler, data };
// };

// /** Filtrer les persons avec pagination */
// const filterPerson = async (
//   req: FastifyRequest<{ Body: Partial<IPersonPaginationBody> }>
// ) => {
//   const handler = await PersonHandlers.filterPerson(req);
//   const res = handler.data;
//   const pagination = req.body;
//   await test('Vérifier si la pagination retourné correspond', async (t: TestContext) => {
//     if (!res) return t.assert.fail('Aucune données retournées !');
//     if (res.page === undefined)
//       return t.assert.fail('Page ne peut pas être undefined !');
//     if (res.pageCount === undefined)
//       return t.assert.fail('PageCount ne peut pas être undefined !');
//     if (res.pageResultsCount === undefined)
//       return t.assert.fail('PageResultsCount ne peut pas être undefined !');
//     if (res.results === undefined)
//       return t.assert.fail('Results ne peut pas être undefined !');
//     if (res.resultsCount === undefined)
//       return t.assert.fail('ResultsCount ne peut pas être undefined !');
//     if (res.resultsLimit === undefined)
//       return t.assert.fail('ResultsLimit ne peut pas être undefined !');
//     if (res.hasNextPage === undefined)
//       return t.assert.fail('hasNextPage ne peut pas être undefined !');
//     if (res.hasPrevPage === undefined)
//       return t.assert.fail('hasPrevPage ne peut pas être undefined !');

//     t.assert.strictEqual(
//       res.pageResultsCount,
//       res?.results.length,
//       'doit avoir la bonne limit de pagination'
//     );

//     t.assert.ok(
//       res.page > 0,
//       'La page pagination de pagination doit toujours etre superieur a 0'
//     );

//     if (pagination.page) {
//       t.assert.strictEqual(
//         res.page,
//         pagination.page,
//         'doit avoir la bonne page de pagination'
//       );

//       t.assert.strictEqual(
//         res.hasNextPage,
//         (res?.pageCount || 1) > (pagination.page || 0) + 1,
//         'doit avoir la bonne hasNextPage de pagination'
//       );

//       t.assert.strictEqual(
//         res.hasPrevPage,
//         (pagination.page || 0) > 1,
//         'doit avoir la bonne hasPrevPage de pagination'
//       );
//     }

//     if (pagination.limit)
//       t.assert.strictEqual(
//         res?.resultsLimit,
//         pagination.limit,
//         'doit avoir la bonne limit de pagination'
//       );
//   });

//   return new APIResponse({ success: true, data: res });
// };

// /** Créer un nouvel person */
// const createPerson = async (
//   req: FastifyRequest<{ Body: IPersonCreateBody }>
// ) => {
//   const handler = await PersonHandlers.createPerson(req);
//   const { data } = handler;
//   const bodyData = req.body.data;
//   if (data) {
//     await PersonEqualTEST('personne', data, {
//       input: bodyData,
//     });
//   } else {
//     await test(`Il n'y a pas de données`, async (t) => {
//       t.assert.fail(`Il n'y a pas de données la personne qui devait être crée`);
//     });
//   }
//   return handler;
// };

// /** Modifier un person */
// const updatePerson = async (
//   req: FastifyRequest<{ Body: IPersonCreateBody; Params: { id: string } }>
// ) => {
//   const handler = await PersonHandlers.updatePerson(req);
//   const { data } = handler;
//   const bodyData = req.body.data;
//   if (data) {
//     await PersonEqualTEST('personne', data, {
//       input: bodyData,
//     });
//   } else {
//     await test(`Il n'y a pas de données`, async (t) => {
//       t.assert.fail(
//         `Il n'y a pas de données la personne qui devait être modifié`
//       );
//     });
//   }
//   return handler;
// };

// /** Supprimer un person */
// const deletePerson = async (
//   req: FastifyRequest<{ Body: IMediaDeleteBody; Params: { id: string } }>
// ) => {
//   const handler = await PersonHandlers.deletePerson(req);
//   const res = handler.data;
//   await test("L'person a bien été supprimé ?", async (t) => {
//     t.plan(2);
//     t.assert.equal(
//       res?.id,
//       req.params.id,
//       "L'id de l'person et celui en paramêtre doit correspondre"
//     );
//     const findPerson = await Person.get(req.params.id, {
//       session: req.mongooseSession,
//     });
//     t.assert.equal(findPerson, null, "L'person ne devrait plus exister");
//   });
//   return handler;
// };

// /** Vérifier un person */
// const verifyPerson = async (
//   req: FastifyRequest<{ Body: IMediaDeleteBody; Params: { id: string } }>
// ) => {
//   const handler = await PersonHandlers.verifyPerson(req);
//   const res = handler.data;
//   await test("L'person est bien devenu vérifié", async (t) => {
//     const db = await Person.get(req.params.id, {
//       session: req.mongooseSession,
//     });
//     if (!db) t.assert.fail("Pas d'person trouvé");
//     t.assert.equal(res?.id, req.params.id, 'doit être égale');
//     t.assert.equal(res?.isVerified, db?.isVerified, 'doit être égale');
//     t.assert.notEqual(db?.isVerified, false, 'doit pas être égale a false');
//   });
//   return handler;
// };

// /** Vérifier un person */
// const unverifyPerson = async (
//   req: FastifyRequest<{ Body: IMediaDeleteBody; Params: { id: string } }>
// ) => {
//   const handler = (await PersonHandlers.unverifyPerson(
//     req
//   )) as APIResponse<IPerson>;
//   const res = handler.data;
//   await test("L'person est bien devenu non vérifié", async (t) => {
//     const db = await Person.get(req.params.id, {
//       session: req.mongooseSession,
//     });
//     if (!db) t.assert.fail("Pas d'person trouvé");
//     t.assert.equal(res?.id, req.params.id, 'doit être égale');
//     t.assert.equal(res?.isVerified, db?.isVerified, 'doit être égale');
//     t.assert.notEqual(db?.isVerified, true, 'doit pas être égale a true');
//   });
//   return handler;
// };

// /** Filtrer les demandes de création/modification d'un person */
// const filterPersonRequestByPersonID = async (
//   req: FastifyRequest<{ Body: IPatchPaginationBody; Params: { id: string } }>
// ) => {
//   const handler = await PersonHandlers.filterPersonRequestByPersonID(req);
//   // const res = handler.data;
//   return handler;
// };

// /** Faire une demande de création d'un person */
// const createPersonRequest = async (
//   req: FastifyRequest<{ Body: IPersonCreateBody }>
// ) => {
//   const handler = await PersonHandlers.createPersonRequest(req);
//   const { data } = handler;
//   const bodyData = req.body.data;
//   if (data) {
//     await PersonEqualTEST('personne', data, {
//       input: bodyData,
//     });
//   } else {
//     await test(`Il n'y a pas de données`, async (t) => {
//       t.assert.fail(
//         `Il n'y a pas de données la personne qui devait être crée (demande)`
//       );
//     });
//   }
//   return handler;
// };

// /** Faire une demande de modification d'un person */
// const updatePersonRequest = async (
//   req: FastifyRequest<{ Body: IPersonCreateBody; Params: { id: string } }>
// ) => {
//   const handler = await PersonHandlers.updatePersonRequest(req);
//   const { data } = handler;
//   const bodyData = req.body.data;
//   if (data) {
//     await PersonEqualTEST('personne', data, {
//       input: bodyData,
//     });
//   } else {
//     await test(`Il n'y a pas de données`, async (t) => {
//       t.assert.fail(
//         `Il n'y a pas de données la personne qui devait être modifié (demande)`
//       );
//     });
//   }
//   return handler;
// };

// /**
//  * Modifier la demande de modification d'un person;
//  * @explication
//  * Modifier les changements qu'apporte la demande de modification a l'person;
//  * */
// const updatePersonPatch = async (
//   req: FastifyRequest<{
//     Body: IPersonCreateBody;
//     Params: { personID: string; patchID: string };
//   }>
// ) => {
//   const handler = await PersonHandlers.updatePersonPatch(req);
//   const { data } = handler;
//   const bodyData = req.body.data;
//   if (data) {
//     await PersonEqualTEST('personne', data, {
//       input: bodyData,
//     });
//   } else {
//     await test(`Il n'y a pas de données`, async (t) => {
//       t.assert.fail(`Il n'y a pas de données pour le patch d'une personne`);
//     });
//   }
//   return handler;
// };

// /** Accepter la demande de modification d'un person */
// const acceptPersonPatch = async (
//   req: FastifyRequest<{
//     Body: IMediaVerifyBody;
//     Params: { personID: string; patchID: string };
//   }>
// ) => {
//   const handler = await PersonHandlers.acceptPersonPatch(req);
//   const { data } = handler;
//   await test("L'person est bien bien accepté", async (t) => {
//     const db = await Person.get(req.params.personID, {
//       session: req.mongooseSession,
//     });
//     if (!db) return t.assert.fail("Pas d'person trouvé");
//     t.assert.equal(data?.id, req.params.personID, 'doit être égale');
//     t.assert.equal(data?.isVerified, db?.isVerified, 'doit être égale');
//   });
//   await test('Le patch a bien été accepté', async (t) => {
//     const db = await Patch.get(req.params.patchID, {
//       session: req.mongooseSession,
//     });
//     if (!db) return t.assert.fail('Pas de patch trouve');
//     t.assert.equal(data?.id, db.target.id, 'doit être égale');
//     t.assert.equal(db?.status, 'ACCEPTED', 'doit être égale');
//   });
//   return handler;
// };

// /** Refuser la demande de modification d'un person */
// const rejectPersonPatch = async (
//   req: FastifyRequest<{
//     Body: IMediaVerifyBody;
//     Params: { personID: string; patchID: string };
//   }>
// ) => {
//   const handler = await PersonHandlers.rejectPersonPatch(req);
//   const { data } = handler;
//   await test("L'person est bien bien refusé", async (t) => {
//     const dbPatch = await Patch.get(req.params.patchID, {
//       session: req.mongooseSession,
//       json: false,
//       nullThrowErr: true,
//     });
//     const db = await Person.get(req.params.personID, {
//       session: req.mongooseSession,
//     });
//     if (dbPatch?.isCreate() && db)
//       return t.assert.fail("Pourquoi l'person pré-crée existe toujours ?");
//     t.assert.equal(data?.id, req.params.personID, 'doit être égale');
//     t.assert.equal(data?.id, dbPatch.target.id, 'doit être égale');
//     t.assert.equal(dbPatch?.status, 'REJECTED', 'doit être égale');
//   });
//   return handler;
// };

// /** Supprimer la demande de modification d'un person */
// const deletePersonPatch = async (
//   req: FastifyRequest<{
//     Body: IMediaVerifyBody;
//     Params: { personID: string; patchID: string };
//   }>
// ) => {
//   const handler = await PersonHandlers.deletePersonPatch(req);
//   // const { data, patch } = handler;
//   await test('La demande a bien été supprimé', async (t) => {
//     const dbPatch = await Patch.get(req.params.patchID, {
//       session: req.mongooseSession,
//       json: false,
//     });

//     if (dbPatch) {
//       t.assert.equal(dbPatch?.status, 'PENDING', 'doit être égale a PENDING');
//       t.assert.equal(dbPatch?.id, req.params.patchID, 'doit être égale');
//     }
//   });
//   return handler;
// };

// export const PersonHandlersTest = {
//   // Obtenir
//   getPerson,
//   filterPerson,

//   // Gestion directe
//   createPerson,
//   updatePerson,
//   deletePerson,
//   verifyPerson,
//   unverifyPerson,

//   // Demandes
//   filterPersonRequestByPersonID,
//   createPersonRequest,
//   updatePersonRequest,

//   // Gestion des demandes
//   updatePersonPatch,
//   acceptPersonPatch,
//   rejectPersonPatch,
//   deletePersonPatch,
// };
