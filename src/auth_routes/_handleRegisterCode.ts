import { genPublicID } from "@actunime/utils";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { authClients } from "../_utils/_authClients";
import { AuthorizationCodeModel, EmailRegisterCodeModel, AccountModel, UserModel } from "@actunime/mongoose-models";
import mongoose from "mongoose";


export const HandleRegisterCode = async (
    req: FastifyRequest<{ Body: { code: string; state: string; client_id: string; email: string } }>,
    res: FastifyReply,
) => {

    const url = new URL(`https://${process.env.HOST}${process.env.NODE_ENV === 'production' ? '' : `:${process.env.PORT}`}/register/code`);
    url.searchParams.set("email", req.body.email);
    url.searchParams.set("state", req.body.state);
    url.searchParams.set("client_id", req.body.client_id);

    let errMessage = "";
    try {
        const { data: parsedData, error } = z.object({
            code: z.string(),
            state: z.string(),
            client_id: z.string().refine((v) => Object.keys(authClients).includes(v), { message: "Client ID invalide" }),
            email: z.string().email({ message: "Email invalide" }),
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

        const { code, state, client_id, email } = parsedData;
        url.searchParams.set("email", email);
        url.searchParams.set("state", state);
        url.searchParams.set("client_id", client_id);


        const findCode = await EmailRegisterCodeModel.findOne({ code, email });


        if (!findCode) {
            errMessage = "Le code a expiré ou est invalide. Veuillez recommencer.";
            url.searchParams.set("error", errMessage);
            res.redirect(url.toString());
            return;
        }

        const findAccount = await AccountModel.findOne({ email });
        const session = await mongoose.startSession();

        try {
            session.startTransaction();

            if (findAccount) {
                errMessage = "Un compte avec cette adresse email existe deja. Veuillez vous connecter.";
                url.searchParams.set("error", errMessage);
                await EmailRegisterCodeModel.deleteOne({ code });
                res.redirect(url.toString());
                return;
            }

            await EmailRegisterCodeModel.deleteOne({ code }, { session });
            const findUser = await UserModel.findOne({ username: findCode.data.username });

            const newUser = new UserModel({
                username: findUser ? `${findCode.data.username}-${genPublicID(3, true)}` : findCode.data.username,
                displayName: findCode.data.displayName,
                bio: findCode.data.bio
            });

            await newUser.validate();
            await newUser.save({ session });

            await AccountModel.create([{
                user: newUser._id,
                userId: newUser.id,
                email
            }], { session });

            await session.commitTransaction();

            const authorizationCode = genPublicID(15);
            await AuthorizationCodeModel.create({ code: authorizationCode, userId: newUser.id, clientId: client_id });
            res.redirect(`${authClients[client_id as keyof typeof authClients].redirectUri}?code=${authorizationCode}&state=${state}`);

        } catch (error: any) {
            await session.abortTransaction();
            console.error(error);
        }

    } catch (error) {
        console.error(error);
        url.searchParams.set("error", "Une erreur inconnue s'est produite, veuillez ressayer ultérieurement.");
        res.redirect(url.toString());
    }
}