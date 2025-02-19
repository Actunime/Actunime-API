import { IInscription_Zod_Schema, Inscription_Zod_Schema } from "@actunime/validations";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { HCaptchaIsValid } from "../_utils/_verifyCaptcha";
import { EmailRegisterCodeModel, AccountModel, UserModel } from "@actunime/mongoose-models";
import { authClients } from "../_utils/_authClients";
import { genPublicID } from "@actunime/utils";
import { MailTransport } from "../_utils/_nodemailer";
import { UAParser } from "ua-parser-js";
import geolite from "geoip-lite";

function parseData(input) {
    const output = {};
    for (const key in input) {
        if (input[key] && key.match(/[[\]]{1,2}/)) {
            const [outerKey, innerKey] = key.split(/[[\]]{1,2}/).filter(k => k);
            if (!output[outerKey]) {
                output[outerKey] = {};
            }
            output[outerKey][innerKey] = input[key];
        } else {
            output[key] = input[key];
        }
    }
    return output;
}


export async function HandleRegister(
    this: FastifyInstance,
    req: FastifyRequest<{
        Body: {
            state: string;
            client_id: string;
            "h-captcha-response": string;
            data: Partial<IInscription_Zod_Schema>;
        }
    }>,
    res: FastifyReply
) {

    const rawBody: any = parseData(req.body);
    const url = new URL(`https://${process.env.HOST}${process.env.NODE_ENV === 'production' ? '' : `:${process.env.PORT}`}/register`);
    url.searchParams.set("state", rawBody?.state || "");
    url.searchParams.set("client_id", rawBody?.client_id || "");

    let errMessage = "";

    try {

        const { data: ParsedData, error } = z.object({
            state: z.string(),
            client_id: z.string().refine((v) => Object.keys(authClients).includes(v), { message: "Client ID invalide" }),
            "h-captcha-response": z.string({ required_error: "Veuillez résoudre le captcha" }),
            data: Inscription_Zod_Schema
        }).safeParse(rawBody);

        url.searchParams.set("state", ParsedData?.state || rawBody?.state || "");
        url.searchParams.set("client_id", ParsedData?.client_id || rawBody?.client_id || "");

        if (error) {

            // Vérification des erreurs de validation ZOD
            if (error instanceof z.ZodError) {
                errMessage = error.issues.map(issue => {
                    return issue.message;
                }).join(", ");
            }

            url.searchParams.set("error", errMessage);
            res.redirect(url.toString());
            return;
        }

        const {
            state,
            client_id,
            "h-captcha-response": captchaToken,
            data: RegisterData
        } = ParsedData;

        // Vérification du captcha;
        const captchaIsValid = await HCaptchaIsValid(captchaToken);

        if (!captchaIsValid) {
            errMessage = "La validation du captcha a echoué. Veuillez recommencer.";
            url.searchParams.set("error", errMessage);
            res.redirect(url.toString());
            return;
        }

        // Vérification de l'existance d'un email déja existant
        const findAccount = await AccountModel.findOne({ email: RegisterData.email });

        if (findAccount) {
            errMessage = "Un compte avec cette adresse email existe déjà";
            url.searchParams.set("error", errMessage);
            res.redirect(url.toString());
            return;
        }

        const findUsername = await UserModel.findOne({ username: RegisterData.username });

        if (findUsername) {
            errMessage = "Un compte avec ce nom d'utilisateur existe deja";
            url.searchParams.set("error", errMessage);
            res.redirect(url.toString());
            return;
        }

        const newUser = new UserModel({
            username: RegisterData.username,
            displayName: RegisterData.displayName,
            bio: RegisterData.bio,
        });

        try {
            await newUser.validate();
        } catch (err) {
            errMessage = "Hmm, c'est assez embarrassant, mais nous n'avons pas pu créer votre compte. Veuillez ressayer ultérieurement.";
            url.searchParams.set("error", errMessage);
            res.redirect(url.toString());
            return;
        }

        const code = genPublicID(6, true);
        const email = RegisterData.email;
        const { "user-agent": userAgent } = req.headers;
        const userInfo = new UAParser(userAgent as string | undefined);
        const browser = userInfo.getBrowser();
        const os = userInfo.getOS();
        const location = geolite.lookup(req.ip);
        const device = browser?.name && os?.name && browser.name + " " + os.name + `${location ? `(${location?.city}, ${location?.country})` : ""}`;

        await EmailRegisterCodeModel.create({
            code,
            email: RegisterData.email,
            data: RegisterData,
            device
        });

        await MailTransport.sendMail({
            to: email,
            from: process.env.EMAIL_FROM,
            subject: "Inscription | Actunime",
            text: `Votre code pour valider votre inscription est ${code}`,
            html: `<p>Votre code pour valider votre inscription est <b>${code}</b> <br/> <br/>Si vous n'avez pas demandé ce code, veuillez ignorer ce message. <br/> Tantative de connexion depuis ${device}</p>`,
        })

        res.redirect("/register/code" + "?email=" + email + "&state=" + state + "&client_id=" + client_id);

    } catch (error) {
        console.error(error);
        url.searchParams.set("error", "Une erreur inconnue s'est produite, veuillez ressayer ultérieurement.");
        res.redirect(url.toString());
    }
}