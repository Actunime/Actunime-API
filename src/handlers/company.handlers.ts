import { FastifyRequest } from 'fastify';
import { CompanyController } from '../controllers/company.controller';
import { APIResponse } from '../_utils/_response';
import {
  ICompanyCreateBody,
  ICompanyPaginationBody,
  IMediaDeleteBody,
  IMediaVerifyBody,
  IPatchPaginationBody,
} from '@actunime/validations';
import { PatchController } from '../controllers/patch.controllers';
import { Company } from '../_lib/media/_company';

const controller = new CompanyController();

/** Récupérer un company a partir de son identifiant */
const getCompany = async (req: FastifyRequest<{ Params: { id: string } }>) => {
  const { id } = req.params;
  const res = await Company.get(id, { nullThrowErr: true });
  return new APIResponse({ success: true, data: res });
};

/** Filtrer les companys avec pagination */
const filterCompany = async (
  req: FastifyRequest<{ Body: Partial<ICompanyPaginationBody> }>
) => {
  const companys = await controller.pagination(req.body);
  return new APIResponse({ success: true, data: companys });
};

/** Créer un nouvel company */
const createCompany = async (
  req: FastifyRequest<{ Body: ICompanyCreateBody }>
) => {
  const user = req.me!;
  const controller = new CompanyController(req.mongooseSession, {
    log: req.logSession,
    user,
  });

  const description = req.body.description;
  const input = req.body.data;

  const res = await controller.create(input, { description });

  return new APIResponse({ success: true, ...res });
};

/** Modifier un company */
const updateCompany = async (
  req: FastifyRequest<{ Body: ICompanyCreateBody; Params: { id: string } }>
) => {
  const user = req.me!;
  const controller = new CompanyController(req.mongooseSession, {
    log: req.logSession,
    user,
  });

  const description = req.body.description;
  const input = req.body.data;

  const res = await controller.update(req.params.id, input, { description });

  return new APIResponse({ success: true, ...res });
};

/** Supprimer un company */
const deleteCompany = async (
  req: FastifyRequest<{ Body: IMediaDeleteBody; Params: { id: string } }>
) => {
  const user = req.me!;

  const controller = new CompanyController(req.mongooseSession, {
    log: req.logSession,
    user,
  });

  const res = await controller.delete(req.params.id, req.body);

  return new APIResponse({ success: true, ...res });
};

/** Vérifier un company */
const verifyCompany = async (
  req: FastifyRequest<{ Body: IMediaDeleteBody; Params: { id: string } }>
) => {
  const user = req.me!;
  const controller = new CompanyController(req.mongooseSession, {
    log: req.logSession,
    user,
  });

  const data = await controller.verify(req.params.id);

  return new APIResponse({ success: true, data });
};

/** Vérifier un company */
const unverifyCompany = async (
  req: FastifyRequest<{ Body: IMediaDeleteBody; Params: { id: string } }>
) => {
  const user = req.me!;
  const controller = new CompanyController(req.mongooseSession, {
    log: req.logSession,
    user,
  });

  const data = await controller.unverify(req.params.id);

  return new APIResponse({ success: true, data });
};

/** Filtrer les demandes de création/modification d'un company */
const filterCompanyRequestByCompanyID = async (
  req: FastifyRequest<{ Body: IPatchPaginationBody; Params: { id: string } }>
) => {
  if (req.body?.query?.target) delete req.body.query.target;
  if (req.body?.query?.targetPath) delete req.body.query.targetPath;
  const companysPatchs = await new PatchController().pagination({
    ...req.body,
    query: {
      ...req.body.query,
      target: { id: req.params.id },
      targetPath: 'Company',
    },
  });
  return new APIResponse({ success: true, data: companysPatchs });
};

/** Faire une demande de création d'un company */
const createCompanyRequest = async (
  req: FastifyRequest<{ Body: ICompanyCreateBody }>
) => {
  const user = req.me!;
  const controller = new CompanyController(req.mongooseSession, {
    log: req.logSession,
    user,
  });

  const description = req.body.description;
  const input = req.body.data;

  const res = await controller.create_request(input, { description });

  return new APIResponse({ success: true, ...res });
};

/** Faire une demande de modification d'un company */
const updateCompanyRequest = async (
  req: FastifyRequest<{ Body: ICompanyCreateBody; Params: { id: string } }>
) => {
  const user = req.me!;
  const controller = new CompanyController(req.mongooseSession, {
    log: req.logSession,
    user,
  });

  const description = req.body.description;
  const input = req.body.data;

  const res = await controller.update_request(req.params.id, input, {
    description,
  });

  return new APIResponse({ success: true, ...res });
};

/**
 * Modifier la demande de modification d'un company;
 * @explication
 * Modifier les changements qu'apporte la demande de modification a l'company;
 * */
const updateCompanyPatch = async (
  req: FastifyRequest<{
    Body: ICompanyCreateBody;
    Params: { companyID: string; patchID: string };
  }>
) => {
  const user = req.me!;

  const controller = new CompanyController(req.mongooseSession, {
    log: req.logSession,
    user,
  });
  const description = req.body.description;
  const input = req.body.data;

  const res = await controller.update_patch(
    req.params.companyID,
    req.params.patchID,
    input,
    { description }
  );
  return new APIResponse({ success: true, ...res });
};

/** Accepter la demande de modification d'un company */
const acceptCompanyPatch = async (
  req: FastifyRequest<{
    Body: IMediaVerifyBody;
    Params: { companyID: string; patchID: string };
  }>
) => {
  const user = req.me!;

  const controller = new CompanyController(req.mongooseSession, {
    log: req.logSession,
    user,
  });

  const res = await controller.accept_patch(
    req.params.companyID,
    req.params.patchID,
    // req.body
  );
  return new APIResponse({ success: true, ...res });
};

/** Refuser la demande de modification d'un company */
const rejectCompanyPatch = async (
  req: FastifyRequest<{
    Body: IMediaVerifyBody;
    Params: { companyID: string; patchID: string };
  }>
) => {
  const user = req.me!;

  const controller = new CompanyController(req.mongooseSession, {
    log: req.logSession,
    user,
  });

  const res = await controller.reject_patch(
    req.params.companyID,
    req.params.patchID,
    // req.body
  );
  return new APIResponse({ success: true, ...res });
};

/** Supprimer la demande de modification d'un company */
const deleteCompanyPatch = async (
  req: FastifyRequest<{
    Body: IMediaVerifyBody;
    Params: { companyID: string; patchID: string };
  }>
) => {
  const user = req.me!;

  const controller = new CompanyController(req.mongooseSession, {
    log: req.logSession,
    user,
  });

  const res = await controller.delete_patch(
    req.params.companyID,
    req.params.patchID,
    // req.body
  );
  
  return new APIResponse({ success: true, ...res });
};

export const CompanyHandlers = {
  // Obtenir
  getCompany,
  filterCompany,

  // Gestion directe
  createCompany,
  updateCompany,
  deleteCompany,
  verifyCompany,
  unverifyCompany,

  // Demandes
  filterCompanyRequestByCompanyID,
  createCompanyRequest,
  updateCompanyRequest,

  // Gestion des demandes
  updateCompanyPatch,
  acceptCompanyPatch,
  rejectCompanyPatch,
  deleteCompanyPatch,
};
