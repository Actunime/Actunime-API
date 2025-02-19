import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { AccessTokenModel, EmailCodeModel, AccountModel, UserModel } from "@actunime/mongoose-models";
import { HCaptchaIsValid } from "../_utils/_verifyCaptcha";

export const HandleDeleteAccountCode = async (
    req: FastifyRequest<{
        Body: {
            code: string;
            userId: string;
            "h-captcha-response": string;
        }
    }>,
    res: FastifyReply,
) => {
    try {

        if (!req.currentUser)
            return res.status(401).send({ error: "Unauthorized" });

        const { code, userId, "h-captcha-response": hCaptchaResponse } = z.object({
            code: z.string(),
            userId: z.string(),
            "h-captcha-response": z.string(),
        }).parse(req.body);

        if (req.currentUser.id !== userId)
            return res.status(401).send({ error: "Unauthorized" });

        const captchaIsValid = await HCaptchaIsValid(hCaptchaResponse);

        if (!captchaIsValid)
            return res.status(401).send({ error: "Le captcha n'a pas pu à fonctionner. Veuillez recommencer." });

        let error = "";
        const findCode = await EmailCodeModel.findOne({ code, userId });

        if (!findCode)
            error = "Le code est invalide ou a expiré.";


        if (error) {
            res.send({ error }).status(400);
            return;
        }

        if (findCode) {
            await EmailCodeModel.deleteOne({ code });
            await UserModel.deleteOne({ id: userId });
            await AccountModel.deleteOne({ userId });
            await AccessTokenModel.deleteMany({ userId });
            req.currentUser = undefined;
            res.send({ success: true }).status(200);
        }

    } catch (error) {
        console.error(error);
        res.status(400);
    }
}