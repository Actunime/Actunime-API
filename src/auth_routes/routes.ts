import { FastifyInstance } from "fastify";
import { LoginPage } from "./_loginPage";
import { HandleLogin } from "./_handleLogin";
import { Authorize } from "./_authorize";
import { HandleCode } from "./_handleLoginCode";
import { Token } from "./_token";
import { CodePage } from "./_codePage";
import { CodeExpirePage } from "./_codeExpirePage";
import { RedirectToClient } from "./_redirectToClient";
import { RegisterPage } from "./_registerPage";
import { HandleRegister } from "./_handleRegister";
import { RegisterCodePage } from "./_registerCodePage";
import { HandleRegisterCode } from "./_handleRegisterCode";
import { AuthValidation } from "../_lib/auth";
import { LogoutFull } from "./_logoutFull";
import { GetLoggedDevices } from "./_getLoggedDevices";
import { HandleDeleteAccountCode } from "./_handleDeleteAccountCode";
import { HandleDeleteAccount } from "./_handleDeleteAccount";

export function Auth_Routes_V1(fastify: FastifyInstance) {
    // fastify.decorate("authenticate",
    //     async function (request, reply) {
    //         try {
    //             await request.jwtVerify<{ userId: string }>();
    //             // console.log("decoded", decoded);
    //             // const findUser = await UserModel.findOne({ id: decoded.userId });
    //             // if (!findUser) throw new Error("User not found");

    //             // request.user = findUser.toJSON();

    //         } catch (err) {
    //             reply.send(err).status(401);
    //         }
    //     });

    fastify.route({
        method: "GET",
        url: "/login",
        // preValidation: [fastify.authenticate],
        handler: LoginPage,
    });

    fastify.route({
        method: "POST",
        url: "/login",
        // preValidation: [fastify.authenticate],
        handler: HandleLogin,
    });

    fastify.route({
        method: "GET",
        url: "/login/code",
        // preValidation: [fastify.authenticate],
        handler: CodePage,
    });

    fastify.route({
        method: "POST",
        url: "/login/code",
        // preValidation: [fastify.authenticate],
        handler: HandleCode,
    });

    fastify.route({
        method: "GET",
        url: "/login/code/expire",
        // preValidation: [fastify.authenticate],
        handler: CodeExpirePage,
    });

    fastify.route({
        method: "GET",
        url: "/authorize",
        // preValidation: [fastify.authenticate],
        handler: Authorize,
    });

    fastify.route({
        method: ["POST", "GET"],
        url: "/token",
        // preValidation: [fastify.authenticate],
        handler: Token,
    });

    fastify.route({
        method: "GET",
        url: "/redirect-client",
        // preValidation: [fastify.authenticate],
        handler: RedirectToClient,
    });

    fastify.route({
        method: "GET",
        url: "/register",
        // preValidation: [fastify.authenticate],
        handler: RegisterPage,
    })

    fastify.route({
        method: "POST",
        url: "/register",
        // preValidation: [fastify.authenticate],
        handler: HandleRegister,
    })

    fastify.route({
        method: "GET",
        url: "/register/code",
        // preValidation: [fastify.authenticate],
        handler: RegisterCodePage,
    })

    fastify.route({
        method: "POST",
        url: "/register/code",
        // preValidation: [fastify.authenticate],
        handler: HandleRegisterCode,
    })

    fastify.route({
        method: "POST",
        url: "/logout",
        preValidation: [AuthValidation(["MEMBER"])],
        handler: LogoutFull,
    })

    fastify.route({
        method: "GET",
        url: "/getLoggedDevices",
        preValidation: [AuthValidation(["MEMBER"])],
        handler: GetLoggedDevices,
    })

    fastify.route({
        method: "POST",
        url: "/deleteAccount",
        preValidation: [AuthValidation(["MEMBER"], false)],
        handler: HandleDeleteAccount,
    })

    fastify.route({
        method: "POST",
        url: "/deleteAccount/code",
        preValidation: [AuthValidation(["MEMBER"], false)],
        handler: HandleDeleteAccountCode,
    })

}