import { FastifyInstance } from "fastify";
import { AuthHandlers } from "../handlers/auth.handlers";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { AuthSchema } from "../schema/auth.schema";
import { Utilchema } from "../schema/util.schema";
import { TokenSchema } from "../schema/token.schema";

function AuthRoutes(fastify: FastifyInstance) {
    /** Authentification */
    const app = fastify.withTypeProvider<ZodTypeProvider>();
    app.route({
        method: "POST",
        url: "/login",
        schema: {
            description: "Permet a l'utilisateur de s'authentifier avec un email et un mot de passe",
            tags: ["Auth"],
            body: AuthSchema.LoginBody,
            headers: z.object({
                "Content-Type": z.string().default("application/json"),
            }),
            response: {
                200: Utilchema.ResponseBody(TokenSchema.TokenResponse),
                401: Utilchema.UnauthorizedResponseBody()
            }
        },
        handler: AuthHandlers.Login
    });

    fastify.post("/logout", {
        schema: {
            description: "",
            tags: ["Auth"]
        },
        preHandler: AuthHandlers.AuthRoles(["MEMBER"]),
        handler: AuthHandlers.Logout,
    });
    /** Création de compte */
    fastify.post("/register", {
        schema: {
            description: "",
            tags: ["Auth"]
        },
    }, AuthHandlers.PreRegister);

    fastify.post("/register/code", {
        schema: {
            description: "",
            tags: ["Auth"]
        },
    }, AuthHandlers.Register);
    /** Gestion Token */
    fastify.post("/token/refresh", {
        schema: {
            description: "",
            tags: ["Auth"]
        },
        preHandler: AuthHandlers.AuthRoles(["MEMBER"]),
        handler: AuthHandlers.RefreshToken
    });
}

export default AuthRoutes;