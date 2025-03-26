// import { FastifyRequest } from 'fastify';
// import { APIResponse } from '../../_utils/_response';
// import {
//   IAnimeCreateBody,
//   IAnimePaginationBody,
//   IMediaDeleteBody,
//   IMediaVerifyBody,
//   IPatchPaginationBody,
// } from '@actunime/validations';
// import { AnimeHandlers } from '../anime.handlers';
// import { IAnime } from '@actunime/types';
// import { AnimeEqualTEST } from './media.base.test';
// import { Anime } from '../../_lib/media/_anime';
// import test, { TestContext } from 'node:test';
// import { Patch } from '../../_lib/media';

// /** Récupérer un anime a partir de son identifiant */
// const getAnime = async (req: FastifyRequest<{ Params: { id: string } }>) => {
//   const handler = await AnimeHandlers.getAnime(req);
//   const data = handler.data;
//   if (data) {
//     await test("Vérifier si l'anime retourné est égale a l'anime dans la base de donnée", async (t) => {
//       const old = new Anime(data);
//       const { changes } = await old.getDBDiff();
//       if (changes && changes.length)
//         return t.assert.fail(
//           `${changes.length} changements ont été détecté c'est pas normal !`
//         );
//     });
//   } else {
//     await test(`Il n'y a pas de données pour l'anime ${req.params.id}`, async (t) => {
//       const getAnime = await Anime.get(req.params.id);
//       if (getAnime)
//         return t.assert.fail(
//           `Il n'a pas de données pour l'anime ${req.params.id} alors qu'il existe bien !`
//         );
//     });
//   }
//   return { ...handler, data };
// };

// /** Filtrer les animes avec pagination */
// const filterAnime = async (
//   req: FastifyRequest<{ Body: Partial<IAnimePaginationBody> }>
// ) => {
//   const handler = await AnimeHandlers.filterAnime(req);
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

// /** Créer un nouvel anime */
// const createAnime = async (req: FastifyRequest<{ Body: IAnimeCreateBody }>) => {
//   const handler = await AnimeHandlers.createAnime(req);
//   const data = handler.data;
//   const bodyData = req.body.data;
//   await AnimeEqualTEST(data, bodyData, {
//     session: req.mongooseSession,
//     patchStatus: 'ACCEPTED',
//   });
//   return { ...handler, data };
// };

// /** Modifier un anime */
// const updateAnime = async (
//   req: FastifyRequest<{ Body: IAnimeCreateBody; Params: { id: string } }>
// ) => {
//   const handler = await AnimeHandlers.updateAnime(req);
//   const data = handler.data;
//   const bodyData = req.body.data;
//   await AnimeEqualTEST(data, bodyData, {
//     session: req.mongooseSession,
//     patchStatus: 'ACCEPTED',
//   });
//   return { ...handler, data };
// };

// /** Supprimer un anime */
// const deleteAnime = async (
//   req: FastifyRequest<{ Body: IMediaDeleteBody; Params: { id: string } }>
// ) => {
//   const handler = await AnimeHandlers.deleteAnime(req);
//   const res = handler.data;
//   await test("L'anime a bien été supprimé ?", async (t) => {
//     t.plan(2);
//     t.assert.equal(
//       res?.id,
//       req.params.id,
//       "L'id de l'anime et celui en paramêtre doit correspondre"
//     );
//     const findAnime = await Anime.get(req.params.id, {
//       session: req.mongooseSession,
//     });
//     t.assert.equal(findAnime, null, "L'anime ne devrait plus exister");
//   });
//   return handler;
// };

// /** Vérifier un anime */
// const verifyAnime = async (
//   req: FastifyRequest<{ Body: IMediaDeleteBody; Params: { id: string } }>
// ) => {
//   const handler = await AnimeHandlers.verifyAnime(req);
//   const res = handler.data;
//   await test("L'anime est bien devenu vérifié", async (t) => {
//     const db = await Anime.get(req.params.id, { session: req.mongooseSession });
//     if (!db) t.assert.fail("Pas d'anime trouvé");
//     t.assert.equal(res?.id, req.params.id, 'doit être égale');
//     t.assert.equal(res?.isVerified, db?.isVerified, 'doit être égale');
//     t.assert.notEqual(db?.isVerified, false, 'doit pas être égale a false');
//   });
//   return handler;
// };

// /** Vérifier un anime */
// const unverifyAnime = async (
//   req: FastifyRequest<{ Body: IMediaDeleteBody; Params: { id: string } }>
// ) => {
//   const handler = (await AnimeHandlers.unverifyAnime(
//     req
//   )) as APIResponse<IAnime>;
//   const res = handler.data;
//   await test("L'anime est bien devenu non vérifié", async (t) => {
//     const db = await Anime.get(req.params.id, { session: req.mongooseSession });
//     if (!db) t.assert.fail("Pas d'anime trouvé");
//     t.assert.equal(res?.id, req.params.id, 'doit être égale');
//     t.assert.equal(res?.isVerified, db?.isVerified, 'doit être égale');
//     t.assert.notEqual(db?.isVerified, true, 'doit pas être égale a true');
//   });
//   return handler;
// };

// /** Filtrer les demandes de création/modification d'un anime */
// const filterAnimeRequestByAnimeID = async (
//   req: FastifyRequest<{ Body: IPatchPaginationBody; Params: { id: string } }>
// ) => {
//   const handler = await AnimeHandlers.filterAnimeRequestByAnimeID(req);
//   return handler;
// };

// /** Faire une demande de création d'un anime */
// const createAnimeRequest = async (
//   req: FastifyRequest<{ Body: IAnimeCreateBody }>
// ) => {
//   const handler = await AnimeHandlers.createAnimeRequest(req);
//   const data = handler.data;
//   const bodyData = req.body.data;
//   await AnimeEqualTEST(data, bodyData, {
//     session: req.mongooseSession,
//     patchStatus: 'PENDING',
//   });
//   return { ...handler, data };
// };

// /** Faire une demande de modification d'un anime */
// const updateAnimeRequest = async (
//   req: FastifyRequest<{ Body: IAnimeCreateBody; Params: { id: string } }>
// ) => {
//   const handler = (await AnimeHandlers.updateAnimeRequest(
//     req
//   )) as APIResponse<IAnime>;
//   const data = handler.data;
//   const bodyData = req.body.data;
//   await AnimeEqualTEST(data, bodyData, {
//     session: req.mongooseSession,
//     patchStatus: 'PENDING',
//   });
//   return { ...handler, data };
// };

// /**
//  * Modifier la demande de modification d'un anime;
//  * @explication
//  * Modifier les changements qu'apporte la demande de modification a l'anime;
//  * */
// const updateAnimePatch = async (
//   req: FastifyRequest<{
//     Body: IAnimeCreateBody;
//     Params: { animeID: string; patchID: string };
//   }>
// ) => {
//   const handler = await AnimeHandlers.updateAnimePatch(req);
//   const data = handler.data;
//   const bodyData = req.body.data;
//   await AnimeEqualTEST(data, bodyData, {
//     session: req.mongooseSession,
//     patchStatus: 'PENDING',
//   });
//   return { ...handler, data };
// };

// /** Accepter la demande de modification d'un anime */
// const acceptAnimePatch = async (
//   req: FastifyRequest<{
//     Body: IMediaVerifyBody;
//     Params: { animeID: string; patchID: string };
//   }>
// ) => {
//   const handler = await AnimeHandlers.acceptAnimePatch(req);
//   const res = handler.data;
//   await test("L'anime est bien bien accepté", async (t) => {
//     const db = await Anime.get(req.params.animeID, {
//       session: req.mongooseSession,
//     });
//     if (!db) return t.assert.fail("Pas d'anime trouvé");
//     t.assert.equal(res?.id, req.params.animeID, 'doit être égale');
//     t.assert.equal(res?.isVerified, db?.isVerified, 'doit être égale');
//   });
//   await test('Le patch a bien été accepté', async (t) => {
//     const db = await Patch.get(req.params.patchID, {
//       session: req.mongooseSession,
//     });
//     if (!db) return t.assert.fail('Pas de patch trouve');
//     t.assert.equal(res?.id, db.target.id, 'doit être égale');
//     t.assert.equal(db?.status, 'ACCEPTED', 'doit être égale');
//   });
//   return handler;
// };

// /** Refuser la demande de modification d'un anime */
// const rejectAnimePatch = async (
//   req: FastifyRequest<{
//     Body: IMediaVerifyBody;
//     Params: { animeID: string; patchID: string };
//   }>
// ) => {
//   const handler = await AnimeHandlers.rejectAnimePatch(req);
//   const { patch } = handler;
//   await test("L'anime est bien bien refusé", async (t) => {
//     const db = await Anime.get(req.params.animeID, {
//       session: req.mongooseSession,
//     });
//     if (patch?.type === 'CREATE' && db)
//       return t.assert.fail("Pourquoi l'anime pré-crée existe toujours ?");
//     t.assert.equal(patch?.id, req.params.patchID, 'doit être égale');
//     t.assert.equal(patch?.target.id, req.params.animeID, 'doit être égale');
//     t.assert.equal(patch?.status, 'REJECTED', 'doit être égale');
//   });
//   return handler;
// };

// /** Supprimer la demande de modification d'un anime */
// const deleteAnimePatch = async (
//   req: FastifyRequest<{
//     Body: IMediaVerifyBody;
//     Params: { animeID: string; patchID: string };
//   }>
// ) => {
//   const handler = await AnimeHandlers.deleteAnimePatch(req);
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

// export const AnimeHandlersTest = {
//   // Obtenir
//   getAnime,
//   filterAnime,

//   // Gestion directe
//   createAnime,
//   updateAnime,
//   deleteAnime,
//   verifyAnime,
//   unverifyAnime,

//   // Demandes
//   filterAnimeRequestByAnimeID,
//   createAnimeRequest,
//   updateAnimeRequest,

//   // Gestion des demandes
//   updateAnimePatch,
//   acceptAnimePatch,
//   rejectAnimePatch,
//   deleteAnimePatch,
// };
