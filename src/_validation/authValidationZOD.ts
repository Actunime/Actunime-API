import { z } from "zod";




export const Auth__validation_ZOD = z.object({
    email: z.string({ required_error: "Veuillez renseigner votre email" }).email({ message: "Email invalide" }),
    code: z.string({ required_error: "Veuillez renseigner le code" }),
})

export type IAuth__validation_ZOD = z.infer<typeof Auth__validation_ZOD>