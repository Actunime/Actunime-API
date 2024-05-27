import { z } from "zod";

export const Inscription_Zod_Schema = z.object({
    email: z.string({ required_error: "Veuillez renseigner votre email" }).email(),
    username: z.string({ required_error: "Veuillez renseigner votre nom d'utilisateur" }).regex(/^[A-Za-z0-9_-]{2,21}$/gs, "Nom d'utilisateur invalide").min(2).max(21),
    displayName: z.string({ required_error: "Veuillez renseigner votre nom d'affiche" }).min(2).max(32),
    bio: z.optional(z.string().max(200, "Maximum de 200 caractères")),
    image: z.optional(z.object({ avatar: z.optional(z.string()) })),
    captchaToken: z.string({ required_error: "Veuillez résoudre le captcha" }),
});

export type IInscription_Zod_Schema = z.infer<typeof Inscription_Zod_Schema>;