import fastify, { FastifyInstance } from "fastify";
import { ClientSession } from "mongoose";

import * as plugins from './plugins';
import * as hooks from './hooks';

import UserRoutes from './routes/user.routes';
import AuthRoutes from './routes/auth.routes';
import AccountRoutes from './routes/account.routes';
import AnimeRoutes from './routes/anime.routes';
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";

declare module 'fastify' {
    interface FastifyRequest {
        session: ClientSession
    }

    interface FastifyInstance {
        authenticate: (
            request: FastifyRequest,
            reply: FastifyReply
        ) => Promise<void>;
    }
}

class Server {
    public app: FastifyInstance;
    private port: number = process.env.PORT ? parseInt(process.env.PORT as string) : 3000;
    constructor() {
        this.app = fastify({
            logger: true,
            bodyLimit: 30 * 1024 * 1024, // 30 MB
        });

        this.app.setValidatorCompiler(validatorCompiler);
        this.app.setSerializerCompiler(serializerCompiler);
    }

    public async start() {
        console.debug("Chargement du serveur...");
        await this.loadHooks();
        await this.loadPlugin();
        await this.loadRoutes();
        await this.app.listen({ port: this.port });
        console.debug("Serveur lancé !");
    }

    private async loadHooks() {
        console.debug("Chargement des hooks...");
        await Promise.all(
            Object.entries(hooks).map(async ([key, hook]) => {
                await this.app.register(hook);
                console.debug(`| ${key} chargé !`);
            }))
        console.debug("Hooks chargé !");
    }

    private async loadPlugin() {
        console.log("Chargement des plugins...");

        await Promise.all(
            Object.entries(plugins).map(async ([key, plugin]) => {
                await this.app.register(plugin);
                console.debug(`| ${key} chargé !`);
            })
        )

        console.log("Plugins chargé !");
    }

    private async loadRoutes() {
        console.debug("Chargement des routes...");
        await this.app.register(AuthRoutes, { prefix: "/auth" });
        await this.app.register(UserRoutes, { prefix: "/v1/users", });
        await this.app.register(AccountRoutes, { prefix: "/v1/accounts" });
        await this.app.register(AnimeRoutes, { prefix: "/v1/animes" })
        this.app.log.debug(this.app.printRoutes());
        console.debug("Routes chargé !");
    }
}

const FastifyServer = new Server();

export default FastifyServer;