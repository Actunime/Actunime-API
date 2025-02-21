import { FastifyInstance } from "fastify";
import { AccountHandlers } from "../handlers/account.handlers";
import { AuthHandlers } from "../handlers/auth.handlers";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { AccountSchema } from "../schema/account.schema";
import { Utilchema } from "../schema/util.schema";

function AccountRoutes(fastify: FastifyInstance) {
    const app = fastify.withTypeProvider<ZodTypeProvider>();

    app.route({
        method: "GET",
        url: "/:id",
        schema: {
            description: "Permet de récupérer un compte via son identifiant",
            tags: ["Account"],
            response: {
                200: Utilchema.ResponseBody(),
                401: Utilchema.UnauthorizedResponseBody()
            }
        },
        preHandler: AuthHandlers.AuthRoles("ACTUNIME"),
        handler: AccountHandlers.getAccountById
    });

    app.route({
        method: "GET",
        url: "/me",
        schema: {
            description: "Permet de récupérer le compte actuellement authentifié",
            tags: ["Account"],
            response: {
                200: Utilchema.ResponseBody(),
                401: Utilchema.UnauthorizedResponseBody()
            },
            security: [
                {
                    "authorization": []
                }
            ]
        },
        handler: AccountHandlers.getCurrentAccount
    });

    app.route({
        method: "POST",
        url: "/password/reset/email",
        schema: {
            description: "Permet d'envoyer un code de réinitialisation de mot de passe par email",
            tags: ["Account"],
            body: AccountSchema.StartResetPasswordBody,
            headers: Utilchema.JsonHeader,
            response: {
                200: Utilchema.ResponseBody(),
                401: Utilchema.UnauthorizedResponseBody()
            }
        },
        handler: AccountHandlers.startResetPassword
    });

    app.route({
        method: "POST",
        url: "/password/reset",
        schema: {
            description: "Permet de réinitialiser le mot de passe a partir de l'ancien",
            tags: ["Account"],
            body: AccountSchema.ResetPasswordWithOldPassword,
            headers: Utilchema.JsonHeader,
            response: {
                200: Utilchema.ResponseBody(),
                401: Utilchema.UnauthorizedResponseBody()
            }
        },
        handler: AccountHandlers.resetPasswordWithOldPassword
    });

    app.route({
        method: "POST",
        url: "/password/code",
        schema: {
            description: "Permet de vérifier si le code est valide",
            tags: ["Account"],
            body: AccountSchema.PasswordCodeBody,
            headers: Utilchema.JsonHeader,
            response: {
                200: Utilchema.ResponseBody(),
                401: Utilchema.UnauthorizedResponseBody()
            }
        },
        handler: AccountHandlers.verifyPasswordCode
    });

    app.route({
        method: "POST",
        url: "/password/new",
        schema: {
            description: "Permet de définir un nouveau mot de passe",
            tags: ["Account"],
            body: AccountSchema.ResetPasswordBody,
            headers: Utilchema.JsonHeader,
            response: {
                200: Utilchema.ResponseBody(),
                401: Utilchema.UnauthorizedResponseBody()
            }
        },
        handler: AccountHandlers.resetPassword
    });

}

export default AccountRoutes;