import { FastifyRequest } from "fastify";
import { ICreate_Report_ZOD, Patch_Report_ZOD } from "@actunime/validations";
import { z } from "zod";
import { ReportManager } from "../../_lib/report";
import { APIError } from "../../_lib/Error";

export const PatchReportRouter = async (
  req: FastifyRequest<{
    Body: {
      data: ICreate_Report_ZOD;
      note: string;
    };
    Params: {
      id: string;
    };
  }>
) => {
  const { data, note } = z
    .object({ note: z.string().optional(), data: Patch_Report_ZOD })
    .parse(req.body);

  const user = req.currentUser;
  if (!user) throw new APIError("Vous n'êtes pas autorisé !", "UNAUTHORIZED");

  const initReport = new ReportManager(req.session, { user }).init(data);
  await initReport.patch(req.params.id, note);

  return {
    success: true,
  };
};
