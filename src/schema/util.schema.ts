import { z } from "zod"



const ResponseBody = (
  data?: z.AnyZodObject | z.ZodString | z.ZodNull,
  patch?: z.AnyZodObject | z.ZodString | z.ZodNull
) =>
  z.object({
    success: z.boolean().default(true),
    message: z.string().optional(),
    code: z.string().optional(),
    error: z.union([z.string(), z.null()]).optional(),
    status: z.number().default(200),
    data: data || z.any().optional(),
    patch: patch || z.any().optional()
  });

const UnauthorizedResponseBody = (data?: z.AnyZodObject | z.ZodString | z.ZodNull) => z.object({
    success: z.boolean().default(false),
    message: z.string().default("Message d'erreur"),
    code: z.string().default("UNAUTHORIZED"),
    error: z.string().default("Message d'erreur"),
    status: z.number().default(401),
    data: data || z.null()
})

const JsonHeader = z.object({
    "Content-Type": z.string().default("application/json")
})

const IdParam = z.object({ id: z.string() }).strict();

export const Utilchema = {
    ResponseBody,
    IdParam,
    UnauthorizedResponseBody,
    JsonHeader
}
