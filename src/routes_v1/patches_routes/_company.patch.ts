import { FastifyRequest } from "fastify";
import { Create_Company_ZOD, ICreate_Company_ZOD } from "@actunime/validations";
import { z } from "zod";
import { CompanyManager } from "../../_lib/company";
import { APIError } from "../../_lib/Error";

export const PatchCompanyRouter = async (
  req: FastifyRequest<{
    Body: {
      data: ICreate_Company_ZOD;
      note: string;
    };
    Params: {
      id: string;
    };
  }>
) => {

  const { data, note } = z
    .object({
      note: z.string().optional(),
      data: Create_Company_ZOD.partial(),
    })
    .parse(req.body);

  const user = req.currentUser;
  if (!user) throw new APIError("Vous n'êtes pas autorisé !", "UNAUTHORIZED");

  const initCompany = await new CompanyManager(req.session, { user }).init(data);
  await initCompany.patch(req.params.id, note);

  return {
    success: true,
  };
};

export const RequestPatchCompanyRouter = async (
  req: FastifyRequest<{
    Body: {
      data: ICreate_Company_ZOD;
      note: string;
    };
    Params: {
      id: string;
    };
  }>
) => {

  const { data, note } = z
    .object({
      note: z.string().optional(),
      data: Create_Company_ZOD.partial(),
    })
    .parse(req.body);

  const user = req.currentUser;
  if (!user) throw new APIError("Vous n'êtes pas autorisé !", "UNAUTHORIZED");

  const initCompany = await new CompanyManager(req.session, { user, isRequest: true }).init(data);
  await initCompany.updateRequest(req.params.id, note);

  return {
    success: true,
  };
};
