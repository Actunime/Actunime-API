import { z } from "zod";

export const Connexion_Zod_Schema = z.object({
    email: z.string({ required_error: "Veuillez renseigner votre email" }).email(),
    captchaToken: z.string({ required_error: "Veuillez résoudre le captcha" }),
});

export type IConnexion_Zod_Schema = z.infer<typeof Connexion_Zod_Schema>;