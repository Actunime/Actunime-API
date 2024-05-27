import { TargetPathArray } from "../_utils/global";
import { ReportStatusArray, ReportSubjectArray } from "../_utils/reportUtil";
import { z } from "zod";
import { zodNumber } from "./util";

export const Report_Pagination_ZOD = z
  .object({
    page: zodNumber(),
    limit: zodNumber(),
    strict: z.boolean().optional(),
    sort: z
      .object({
        updaptedAt: z.enum(["DESC", "ASC"]).optional(),
        createdAt: z.enum(["DESC", "ASC"]).optional(),
      })
      .partial()
      .strict(),
    query: z
      .object({
        subject: z.enum(ReportSubjectArray).optional(),
        status: z.enum(ReportStatusArray).optional(),
        by: z.string().optional(),
        author: z.string().optional(),
        target: z.string().optional(),
        targetPath: z.enum(TargetPathArray).optional(),
      })
      .partial()
      .strict(),
    with: z
      .object({
        by: z.boolean().optional(),
        author: z.boolean().optional(),
        target: z.boolean().optional(),
      })
      .partial()
      .strict(),
  })
  .partial()
  .strict();

export type IReport_Pagination_ZOD = z.infer<typeof Report_Pagination_ZOD>;
