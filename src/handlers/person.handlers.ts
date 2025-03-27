import { FastifyRequest } from 'fastify';
import { PersonController } from '../controllers/person.controller';
import { APIResponse } from '../_utils/_response';
import {
  IPersonCreateBody,
  IPersonPaginationBody,
  IMediaDeleteBody,
  IMediaVerifyBody,
  IPatchPaginationBody,
} from '@actunime/validations';
import { Person } from '../_lib/media/_person';
import { Checker } from '../_utils/_checker';
import { Patch } from '../_lib/media';

/** Récupérer un person a partir de son identifiant */
const getPerson = async (req: FastifyRequest<{ Params: { id: string } }>) => {
  const { id } = req.params;
  const res = await Person.get(id, { nullThrowErr: true });
  return new APIResponse({ success: true, data: res });
};

/** Filtrer les persons avec pagination */
const filterPerson = async (
  req: FastifyRequest<{ Body: Partial<IPersonPaginationBody> }>
) => {
  const persons = await Person.pagination(req.body);
  return new APIResponse({ success: true, data: persons });
};

/** Créer un nouvel person */
const createPerson = async (
  req: FastifyRequest<{ Body: IPersonCreateBody }>
) => {
  Checker.userIsDefined(req.user);
  const controller = new PersonController(req.mongooseSession, {
    log: req.logSession,
    user: req.user,
  });

  const description = req.body.description;
  const input = req.body.data;

  const res = await controller.create(input, { description });

  return new APIResponse({ success: true, ...res });
};

/** Modifier un person */
const updatePerson = async (
  req: FastifyRequest<{ Body: IPersonCreateBody; Params: { id: string } }>
) => {
  Checker.userIsDefined(req.user);
  const controller = new PersonController(req.mongooseSession, {
    log: req.logSession,
    user: req.user,
  });

  const description = req.body.description;
  const input = req.body.data;

  const res = await controller.update(req.params.id, input, { description });

  return new APIResponse({ success: true, ...res });
};

/** Supprimer un person */
const deletePerson = async (
  req: FastifyRequest<{ Body: IMediaDeleteBody; Params: { id: string } }>
) => {
  Checker.userIsDefined(req.user);

  const controller = new PersonController(req.mongooseSession, {
    log: req.logSession,
    user: req.user,
  });

  const res = await controller.delete(req.params.id, req.body);

  return new APIResponse({ success: true, ...res });
};

/** Vérifier un person */
const verifyPerson = async (
  req: FastifyRequest<{ Body: IMediaDeleteBody; Params: { id: string } }>
) => {
  Checker.userIsDefined(req.user);
  const controller = new PersonController(req.mongooseSession, {
    log: req.logSession,
    user: req.user,
  });

  const data = await controller.verify(req.params.id);

  return new APIResponse({ success: true, data });
};

/** Vérifier un person */
const unverifyPerson = async (
  req: FastifyRequest<{ Body: IMediaDeleteBody; Params: { id: string } }>
) => {
  Checker.userIsDefined(req.user);
  const controller = new PersonController(req.mongooseSession, {
    log: req.logSession,
    user: req.user,
  });

  const data = await controller.unverify(req.params.id);

  return new APIResponse({ success: true, data });
};

/** Filtrer les demandes de création/modification d'un person */
const filterPersonRequestByPersonID = async (
  req: FastifyRequest<{ Body: IPatchPaginationBody; Params: { id: string } }>
) => {
  if (req.body?.query?.target) delete req.body.query.target;
  if (req.body?.query?.targetPath) delete req.body.query.targetPath;
  const personsPatchs = await Patch.pagination({
    ...req.body,
    query: {
      ...req.body.query,
      target: { id: req.params.id },
      targetPath: 'Person',
    },
  });
  return new APIResponse({ success: true, data: personsPatchs });
};

/** Faire une demande de création d'un person */
const createPersonRequest = async (
  req: FastifyRequest<{ Body: IPersonCreateBody }>
) => {
  Checker.userIsDefined(req.user);
  const controller = new PersonController(req.mongooseSession, {
    log: req.logSession,
    user: req.user,
  });

  const description = req.body.description;
  const input = req.body.data;

  const res = await controller.create_request(input, { description });

  return new APIResponse({ success: true, ...res });
};

/** Faire une demande de modification d'un person */
const updatePersonRequest = async (
  req: FastifyRequest<{ Body: IPersonCreateBody; Params: { id: string } }>
) => {
  Checker.userIsDefined(req.user);
  const controller = new PersonController(req.mongooseSession, {
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
 * Modifier la demande de modification d'un person;
 * @explication
 * Modifier les changements qu'apporte la demande de modification a l'person;
 * */
const updatePersonPatch = async (
  req: FastifyRequest<{
    Body: IPersonCreateBody;
    Params: { personID: string; patchID: string };
  }>
) => {
  Checker.userIsDefined(req.user);

  const controller = new PersonController(req.mongooseSession, {
    log: req.logSession,
    user: req.user,
  });
  const description = req.body.description;
  const input = req.body.data;

  const res = await controller.update_patch(
    req.params.personID,
    req.params.patchID,
    input,
    { description }
  );
  return new APIResponse({ success: true, ...res });
};

/** Accepter la demande de modification d'un person */
const acceptPersonPatch = async (
  req: FastifyRequest<{
    Body: IMediaVerifyBody;
    Params: { personID: string; patchID: string };
  }>
) => {
  Checker.userIsDefined(req.user);

  const controller = new PersonController(req.mongooseSession, {
    log: req.logSession,
    user: req.user,
  });

  const res = await controller.accept_patch(
    req.params.personID,
    req.params.patchID
    // req.body
  );
  return new APIResponse({ success: true, ...res });
};

/** Refuser la demande de modification d'un person */
const rejectPersonPatch = async (
  req: FastifyRequest<{
    Body: IMediaVerifyBody;
    Params: { personID: string; patchID: string };
  }>
) => {
  Checker.userIsDefined(req.user);

  const controller = new PersonController(req.mongooseSession, {
    log: req.logSession,
    user: req.user,
  });

  const res = await controller.reject_patch(
    req.params.personID,
    req.params.patchID
    // req.body
  );
  return new APIResponse({ success: true, ...res });
};

/** Supprimer la demande de modification d'un person */
const deletePersonPatch = async (
  req: FastifyRequest<{
    Body: IMediaVerifyBody;
    Params: { personID: string; patchID: string };
  }>
) => {
  Checker.userIsDefined(req.user);

  const controller = new PersonController(req.mongooseSession, {
    log: req.logSession,
    user: req.user,
  });

  const res = await controller.delete_patch(
    req.params.personID,
    req.params.patchID
    // req.body
  );

  return new APIResponse({ success: true, ...res });
};

export const PersonHandlers = {
  // Obtenir
  getPerson,
  filterPerson,

  // Gestion directe
  createPerson,
  updatePerson,
  deletePerson,
  verifyPerson,
  unverifyPerson,

  // Demandes
  filterPersonRequestByPersonID,
  createPersonRequest,
  updatePersonRequest,

  // Gestion des demandes
  updatePersonPatch,
  acceptPersonPatch,
  rejectPersonPatch,
  deletePersonPatch,
};
