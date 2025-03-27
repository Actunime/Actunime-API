import { FastifyRequest } from 'fastify';
import { AnimeController } from '../controllers/anime.controller';
import { APIResponse } from '../_utils/_response';
import {
  IAnimeCreateBody,
  IAnimePaginationBody,
  IMediaDeleteBody,
  IMediaVerifyBody,
  IPatchPaginationBody,
} from '@actunime/validations';
import { Anime } from '../_lib/media/_anime';
import { Checker } from '../_utils/_checker';
import { Patch } from '../_lib/media';

/** Récupérer un anime a partir de son identifiant */
const getAnime = async (req: FastifyRequest<{ Params: { id: string } }>) => {
  const { id } = req.params;
  const res = await Anime.get(id, { nullThrowErr: true });
  return new APIResponse({ success: true, data: res });
};

/** Filtrer les animes avec pagination */
const filterAnime = async (
  req: FastifyRequest<{ Body: Partial<IAnimePaginationBody> }>
) => {
  const animes = await Anime.pagination(req.body);
  return new APIResponse({ success: true, data: animes });
};

/** Créer un nouvel anime */
const createAnime = async (req: FastifyRequest<{ Body: IAnimeCreateBody }>) => {
  Checker.userIsDefined(req.user)
  const controller = new AnimeController(req.mongooseSession, {
    log: req.logSession,
    user: req.user,
  });

  const description = req.body.description;
  const input = req.body.data;

  const res = await controller.create(input, { description });

  return new APIResponse({ success: true, ...res });
};

/** Modifier un anime */
const updateAnime = async (
  req: FastifyRequest<{ Body: IAnimeCreateBody; Params: { id: string } }>
) => {
  Checker.userIsDefined(req.user)
  const controller = new AnimeController(req.mongooseSession, {
    log: req.logSession,
    user: req.user,
  });

  const description = req.body.description;
  const input = req.body.data;

  const res = await controller.update(req.params.id, input, { description });

  return new APIResponse({ success: true, ...res });
};

/** Supprimer un anime */
const deleteAnime = async (
  req: FastifyRequest<{ Body: IMediaDeleteBody; Params: { id: string } }>
) => {
  Checker.userIsDefined(req.user)
  const controller = new AnimeController(req.mongooseSession, {
    log: req.logSession,
    user: req.user,
  });

  const res = await controller.delete(req.params.id, req.body);

  return new APIResponse({ success: true, ...res });
};

/** Vérifier un anime */
const verifyAnime = async (
  req: FastifyRequest<{ Body: IMediaDeleteBody; Params: { id: string } }>
) => {
  Checker.userIsDefined(req.user)
  const controller = new AnimeController(req.mongooseSession, {
    log: req.logSession,
    user: req.user,
  });

  const data = await controller.verify(req.params.id);

  return new APIResponse({ success: true, data });
};

/** Vérifier un anime */
const unverifyAnime = async (
  req: FastifyRequest<{ Body: IMediaDeleteBody; Params: { id: string } }>
) => {
  Checker.userIsDefined(req.user)
  const controller = new AnimeController(req.mongooseSession, {
    log: req.logSession,
    user: req.user,
  });

  const data = await controller.unverify(req.params.id);

  return new APIResponse({ success: true, data });
};

/** Filtrer les demandes de création/modification d'un anime */
const filterAnimeRequestByAnimeID = async (
  req: FastifyRequest<{ Body: IPatchPaginationBody; Params: { id: string } }>
) => {
  if (req.body?.query?.target) delete req.body.query.target;
  if (req.body?.query?.targetPath) delete req.body.query.targetPath;
  const animesPatchs = await Patch.pagination({
    ...req.body,
    query: {
      ...req.body.query,
      target: { id: req.params.id },
      targetPath: 'Anime',
    },
  });
  return new APIResponse({ success: true, data: animesPatchs });
};

/** Faire une demande de création d'un anime */
const createAnimeRequest = async (
  req: FastifyRequest<{ Body: IAnimeCreateBody }>
) => {
  Checker.userIsDefined(req.user)
  const controller = new AnimeController(req.mongooseSession, {
    log: req.logSession,
    user: req.user,
  });

  const description = req.body.description;
  const input = req.body.data;

  const res = await controller.create_request(input, { description });

  return new APIResponse({ success: true, ...res });
};

/** Faire une demande de modification d'un anime */
const updateAnimeRequest = async (
  req: FastifyRequest<{ Body: IAnimeCreateBody; Params: { id: string } }>
) => {
  Checker.userIsDefined(req.user)
  const controller = new AnimeController(req.mongooseSession, {
    log: req.logSession,
    user: req.user,
  });

  const description = req.body.description;
  const input = req.body.data;

  const res = await controller.update_request(req.params.id, input, {
    description,
  });

  return new APIResponse({ success: true, ...res });
};

/**
 * Modifier la demande de modification d'un anime;
 * @explication
 * Modifier les changements qu'apporte la demande de modification a l'anime;
 * */
const updateAnimePatch = async (
  req: FastifyRequest<{
    Body: IAnimeCreateBody;
    Params: { animeID: string; patchID: string };
  }>
) => {
  Checker.userIsDefined(req.user)

  const controller = new AnimeController(req.mongooseSession, {
    log: req.logSession,
    user: req.user,
  });
  const description = req.body.description;
  const input = req.body.data;

  const res = await controller.update_patch(
    req.params.animeID,
    req.params.patchID,
    input,
    { description }
  );
  return new APIResponse({ success: true, ...res });
};

/** Accepter la demande de modification d'un anime */
const acceptAnimePatch = async (
  req: FastifyRequest<{
    Body: IMediaVerifyBody;
    Params: { animeID: string; patchID: string };
  }>
) => {
  Checker.userIsDefined(req.user)

  const controller = new AnimeController(req.mongooseSession, {
    log: req.logSession,
    user: req.user,
  });

  const res = await controller.accept_patch(
    req.params.animeID,
    req.params.patchID
    // req.body
  );
  return new APIResponse({ success: true, ...res });
};

/** Refuser la demande de modification d'un anime */
const rejectAnimePatch = async (
  req: FastifyRequest<{
    Body: IMediaVerifyBody;
    Params: { animeID: string; patchID: string };
  }>
) => {
  Checker.userIsDefined(req.user)

  const controller = new AnimeController(req.mongooseSession, {
    log: req.logSession,
    user: req.user,
  });

  const res = await controller.reject_patch(
    req.params.animeID,
    req.params.patchID
    // req.body
  );

  return new APIResponse({ success: true, ...res });
};

export const AnimeHandlers = {
  // Obtenir
  getAnime,
  filterAnime,

  // Gestion directe
  createAnime,
  updateAnime,
  deleteAnime,
  verifyAnime,
  unverifyAnime,

  // Demandes
  filterAnimeRequestByAnimeID,
  createAnimeRequest,
  updateAnimeRequest,

  // Gestion des demandes
  updateAnimePatch,
  acceptAnimePatch,
  rejectAnimePatch
};
