import { ActivityActionArray, ActivityTypeArray } from "../_utils/activityUtil";
import { z } from "zod";
import { zodNumber } from "./util";
import { TargetPathArray } from "../_utils/global";

export const Activity_Pagination_ZOD = z
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
        type: z.enum(ActivityTypeArray),
        action: z.enum(ActivityActionArray),
        author: z.string().optional(),
        target: z.string().optional(),
        targetPath: z.enum(TargetPathArray),
      })
      .partial()
      .strict(),
    with: z
      .object({
        author: z.boolean().optional(),
        target: z.boolean().optional(),
      })
      .partial()
      .strict(),
  })
  .partial()
  .strict();

type IActivity_Pagination_ZOD = z.infer<typeof Activity_Pagination_ZOD>;

export type { IActivity_Pagination_ZOD };
