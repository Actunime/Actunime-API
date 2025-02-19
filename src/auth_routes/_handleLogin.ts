import { EmailCodeModel, AccountModel } from "@actunime/mongoose-models";
import { genPublicID } from "@actunime/utils";
import { FastifyRequest, FastifyReply } from "fastify";
import { MailTransport } from "../_utils/_nodemailer";
import { z } from "zod";
import { authClients } from "../_utils/_authClients";
import { HCaptchaIsValid } from "../_utils/_verifyCaptcha";
import { URL } from "url";
import { UAParser } from "ua-parser-js";
import geolite from "geoip-lite";

export const HandleLogin = async (
    req: FastifyRequest<{
        Body: {
            email: string;
            state: string;
            client_id: string;
            "h-captcha-response": string;
        }
    }>,
    res: FastifyReply,
) => {

    const url = new URL(`https://${process.env.HOST}${process.env.NODE_ENV === 'production' ? '' : `:${process.env.PORT}`}/login`);
    url.searchParams.set("state", req.body?.state || "");
    url.searchParams.set("client_id", req.body?.client_id || "");

    let errMessage = "";

    try {

        const { data: parsedData, error } = z.object({
            email: z.string().email({ message: "Email invalide" }),
            state: z.string(),
            client_id: z.string().refine((v) => Object.keys(authClients).includes(v), { message: "Client ID invalide" }),
            "h-captcha-response": z.string(),
        }).safeParse(req.body);

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
            email,
            state,
            client_id,
            "h-captcha-response": captchaToken
        } = parsedData;

        url.searchParams.set("email", email);
        url.searchParams.set("state", state);
        url.searchParams.set("client_id", client_id);

        // Vérification du captcha;
        const captchaIsValid = await HCaptchaIsValid(captchaToken);

        if (!captchaIsValid) {
            errMessage = "La validation du captcha a echoué. Veuillez recommencer.";
            url.searchParams.set("error", errMessage);
            res.redirect(url.toString());
            return;
        }

        // Vérification de l'existance du compte
        const findAccount = await AccountModel.findOne({ email });

        if (!findAccount) {
            errMessage = "Ce compte n'existe pas.";
            url.searchParams.set("error", errMessage);
            res.redirect(url.toString());
            return;
        }

        const code = genPublicID(6, true);
        const { "user-agent": userAgent } = req.headers;
        const userInfo = new UAParser(userAgent as string | undefined);
        const browser = userInfo.getBrowser();
        const os = userInfo.getOS();
        const location = geolite.lookup(req.ip);
        const device = browser?.name && os?.name && browser.name + " " + os.name + `${location ? `(${location?.city}, ${location?.country})` : ""}`;
        await EmailCodeModel.create({ code, email, userId: findAccount.userId, device });

        await MailTransport.sendMail({
            to: email,
            from: process.env.EMAIL_FROM,
            subject: "Code de connexion | Actunime",
            text: `Votre code de connexion est ${code}`,
            html: `<p>Votre code de connexion est <b>${code}</b> <br/> <br/>Si vous n'avez pas demandé ce code, veuillez ignorer ce message. <br/> Tantative de connexion depuis ${device}</p>`,
        })

        res.redirect("/login/code" + "?email=" + email + "&state=" + state + "&client_id=" + client_id);

    } catch (error) {
        console.error(error);
        url.searchParams.set("error", "Une erreur inconnue s'est produite, veuillez ressayer ultérieurement.");
        res.redirect(url.toString());
    }
}