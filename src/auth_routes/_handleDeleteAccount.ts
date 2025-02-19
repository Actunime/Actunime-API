import { EmailCodeModel, AccountModel } from "@actunime/mongoose-models";
import { genPublicID } from "@actunime/utils";
import { FastifyRequest, FastifyReply } from "fastify";
import { MailTransport } from "../_utils/_nodemailer";
import { z } from "zod";
import { HCaptchaIsValid } from "../_utils/_verifyCaptcha";

export const HandleDeleteAccount = async (
    req: FastifyRequest<{
        Body: {
            userId: string;
            "h-captcha-response": string;
        }
    }>,
    res: FastifyReply,
) => {

    if (!req.currentUser)
        return res.status(401).send({ error: "Unauthorized" });


    const { userId, "h-captcha-response": captchaToken } = z.object({
        userId: z.string(),
        "h-captcha-response": z.string(),
    }).parse(req.body);

    if (req.currentUser.id !== userId)
        return res.status(401).send({ error: "Unauthorized" });


    let error = "";
    const captchaIsValid = await HCaptchaIsValid(captchaToken);

    if (!captchaIsValid)
        error = "Le captcha n'a pas pu à fonctionner. Veuillez recommencer.";

    const findAccount = await AccountModel.findOne({ userId });

    if (!findAccount)
        error = "Aucun compte lié à cet identifiant.";

    if (error) {
        res.send({ error }).status(400);
        return;
    }

    if (findAccount) {
        const code = genPublicID(6, true);

        await EmailCodeModel.create({ code, email: findAccount.email, userId: findAccount.userId });

        await MailTransport.sendMail({
            to: findAccount.email,
            from: process.env.EMAIL_FROM,
            subject: "Suppression de compte | Actunime",
            text: `Votre code de vérification est ${code}`,
            html: `<p>Votre code de vérification est <b>${code}</b> <br/> <br/>Si vous n'avez pas demandé ce code, veuillez ignorer ce message.</p>`,
        })

        res.send({ success: true }).status(200);
    }
}