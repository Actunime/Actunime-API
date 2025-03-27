/* eslint-disable @typescript-eslint/no-explicit-any */
import fastify, { FastifyInstance, FastifyRequest } from 'fastify';

import * as plugins from './plugins';
import * as hooks from './hooks';

import UserRoutes from './routes/user.routes';
import AuthRoutes from './routes/auth.routes';
import AnimeRoutes from './routes/anime.routes';
import {
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import { APIError } from './_lib/error';
import { DevLog } from './_lib/logger';
import { APIResponse } from './_utils/_response';
import { ZodError } from 'zod';
import fastifyJwt from '@fastify/jwt';
import jwksRsa from 'jwks-rsa';
import fastifyCors from '@fastify/cors';
import PatchRoutes from './routes/patch.routes';
import { swaggerOptions, SwaggerUiOptions } from './_utils/_swagger';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { CheckPermissions, IPermissions, IUser } from '@actunime/types';
import { removeSessionHandler } from './_utils';
import { EndLogSession } from './_utils/_logSession';
import PersonRoutes from './routes/person.routes';
import { User } from './_lib/media/_user';

export class Server {
  public app: FastifyInstance;
  public isTesting = false;
  public testingUser:
    | (Partial<Omit<IUser, 'permissions'>> & { permissions: IPermissions[] })
    | null = null;
  private port: number = process.env.PORT
    ? parseInt(process.env.PORT as string)
    : 3000;
  private jwksClient: jwksRsa.JwksClient;
  public routes: string[] = [];
  constructor(isTesting: boolean = false) {
    this.isTesting = isTesting;
    this.app = fastify({
      logger: true,
      bodyLimit: 30 * 1024 * 1024, // 30 MB
    });

    this.app.setValidatorCompiler(validatorCompiler);
    this.app.setSerializerCompiler(serializerCompiler);
    this.jwksClient = jwksRsa({
      jwksUri:
        'http://localhost:8080/realms/actunime/protocol/openid-connect/certs',
      cache: true,
      rateLimit: true,
    });

    this.app.addContentTypeParser(
      'application/json',
      { parseAs: 'string' },
      function (_req, body: string, done) {
        try {
          const json = JSON.parse(body);
          done(null, json);
        } catch (err) {
          const error = err as any;
          error.statusCode = 400;
          done(error, undefined);
        }
      }
    );

    this.app.decorate('isTesting', this.isTesting);
    this.app.decorateRequest('isTesting', this.isTesting);

    this.app.addHook('onRoute', (route) => {
      const path = route.path.split('/v1')[1]
        ? route.path.split('/v1')[1]
        : route.path;
      if (!this.routes.includes(path)) this.routes.push(path);
    });
  }

  public async start() {
    console.debug('Chargement du serveur...');
    this.errorHandler();
    await this.app.register(fastifySwagger, swaggerOptions);
    await this.app.register(fastifySwaggerUi, SwaggerUiOptions);
    await this.loadHooks();
    await this.loadPlugin();
    await this.authHandler();
    await this.loadRoutes();

    if (!this.isTesting) await this.app.listen({ port: this.port });

    console.debug('Serveur lancé !');
  }

  private async loadHooks() {
    console.debug('Chargement des hooks...');
    await Promise.all(
      Object.entries(hooks).map(async ([key, hook]) => {
        await this.app.register(hook);
        console.debug(`| ${key} chargé !`);
      })
    );
    console.debug('Hooks chargé !');
  }

  private async loadPlugin() {
    console.log('Chargement des plugins...');

    await Promise.all(
      Object.entries(plugins).map(async ([key, plugin]) => {
        await this.app.register(plugin);
        console.debug(`| ${key} chargé !`);
      })
    );

    console.log('Plugins chargé !');
  }

  private async loadRoutes() {
    console.debug('Chargement des routes...');
    this.app.addHook('onSend', async (req, res) => {
      await removeSessionHandler(req, res);
      await EndLogSession(req);
    });
    await this.app.register(AuthRoutes, { prefix: '/auth' });
    await this.app.register(UserRoutes, { prefix: '/v1/users' });
    await this.app.register(AnimeRoutes, { prefix: '/v1/animes' });
    await this.app.register(PersonRoutes, { prefix: '/v1/persons' });
    await this.app.register(PatchRoutes, { prefix: '/v1/patchs' });
    this.app.log.debug(this.app.printRoutes());
    console.debug('Routes chargé !');
  }

  private async authHandler() {
    await this.app.register(fastifyCors, {
      origin: '*',
      // origin: (origin, cb) => {
      //     const checkOrigin = (url: string | undefined): boolean => {
      //         const hostname = url ? new URL(url).hostname : '';
      //         console.debug("Origin", origin, "Hostname", hostname);
      //         return ['localhost', 'actunime.fr'].includes(hostname);
      //     };
      //     if (checkOrigin(origin)) return cb(null, true);
      //     console.error("Origin", origin, "ERRRUR BLOQUAGE");
      //     return cb(null, false);
      // },
    });

    try {
      const raw: any = await this.jwksClient.getKeys();
      if (!raw)
        throw new Error('Unable to fetch public keys from JWK endpoint');
      const key = await this.jwksClient.getSigningKey(raw[1].kid);
      const myCustomMessages = {
        badRequestErrorMessage: 'tok: Format Authorization: Bearer [token]',
        badCookieRequestErrorMessage:
          'tok: Cookie could not be parsed in request',
        noAuthorizationInHeaderMessage:
          'tok: No Authorization was found in request.headers',
        noAuthorizationInCookieMessage:
          'tok: No Authorization was found in request.cookies',
        authorizationTokenExpiredMessage: 'tok: Votre jeton a expiré',
        authorizationTokenUntrusted: 'tok: Untrusted authorization token',
        authorizationTokenUnsigned: 'tok: Unsigned authorization token',
        // for the below message you can pass a sync function that must return a string as shown or a string
        authorizationTokenInvalid: (err: { message: unknown }) => {
          return `tok: Authorization token is invalid: ${err.message}`;
        },
      };

      await this.app.register(fastifyJwt, {
        secret: {
          public: key.getPublicKey() as any,
        },
        verify: {
          algorithms: ['RS256'],
        },
        messages: myCustomMessages,
        decoratorName: 'account',
        formatUser: (payload) => {
          return {
            accountId: payload.sub,
            email: payload.email,
            username: payload.preferred_username,
            permissions: payload.roles,
            discordID: payload.discordID,
            groups: payload.groups,
          } as unknown as User;
        },
      });
    } catch (err) {
      if (err instanceof Error) {
        if (err?.stack?.includes('[ECONNREFUSED]')) {
          DevLog(`${'Impossible de joindre le serveur keycloak'}`, 'error');
        } else console.error(err);
      } else {
        console.error(err);
      }
    }

    const setUser = async (req: FastifyRequest) => {
      if (this.isTesting && this.testingUser) {
        req.user = this.testingUser as any;
      } else {
        if (req.user?.accountId) {
          const user = await User.getByAccount(req.user.accountId, {
            nullThrowErr: true,
            message:
              "Votre compte utilisateur n'existe pas, veuillez vous reconnecter ou bien si le problème persiste rentrer en contact avec le support.",
          });
          req.user = new User({
            ...user,
            ...req.user,
          });
        } else {
          req.user = null;
        }
      }
    };

    const checkJWT = async (req: FastifyRequest) => {
      if (this.isTesting) {
        if (!this.testingUser)
          throw new APIError('Vous devez vous identifier', 'UNAUTHORIZED', 401);
      } else if (req.jwtVerify) {
        await req.jwtVerify();
      } else
        throw new APIError('Vous devez vous identifier', 'UNAUTHORIZED', 401);
    };

    this.app.decorate(
      'authorize',
      (permissions, strict) =>
        async function (req) {
          await checkJWT(req);
          await setUser(req);
          if (
            !CheckPermissions(permissions, req.user?.permissions || [], strict)
          )
            throw new APIError(
              "Vous n'avez pas les permissions pour effectuer cette action",
              'UNAUTHORIZED'
            );
        }
    );
  }

  private errorHandler() {
    this.app.setErrorHandler((error, request, reply) => {
      const res = new APIResponse({
        success: false,
        code: 'SERVER_ERROR',
        error: 'Une erreur est survenue',
        message: 'Une erreur est survenue',
        status: 500,
      });

      console.error('ERREUR HANDLER', error);

      if (typeof error === 'object') {
        if (error instanceof APIError) {
          DevLog(`APIError ${error.code} : ${error.message}`, 'error');
          res.status = error.status || 500;
          res.code = error.code;
          res.error = error.message;
          res.message = error.message;
        } else if (error instanceof ZodError) {
          DevLog(`ZodError : ${error.message}`, 'error');
          res.status = 400;
          res.code = 'BAD_REQUEST';
          res.error = error.message;
          res.message = error.message;
        } else if (error?.message.includes('validation failed:')) {
          DevLog(`MongooseError : ${error.message}`, 'error');
          res.status = 400;
          res.code = 'BAD_REQUEST';
          res.error = error.message;
          res.message = error.message;
        } else if (hasZodFastifySchemaValidationErrors(error)) {
          DevLog(`ZodFastifySchema : ${error.message}`, 'error');
          res.status = 400;
          res.code = 'BAD_REQUEST';
          res.error = error.message;
          res.message = error.message;
        } else if (isResponseSerializationError(error)) {
          DevLog(`Serialization : ${error.message}`, 'error');
          res.status = 400;
          res.code = 'BAD_RESPONSE';
          res.error = error.message;
          res.message = error.message;
        } else if (error.message.startsWith('tok:')) {
          DevLog(`JWT : ${error.message.split(': ')[1]}`, 'error');
          res.status = 401;
          res.code = 'UNAUTHORIZED';
          res.error = error.message.split(': ')[1];
          res.message = error.message.split(': ')[1];
          res.data = { expired: error.message.includes('expired') };
        } else {
          DevLog(`ERREUR URL ${request.url}`, 'error');
          DevLog(
            `ERREUR UNHANDLED ${error.statusCode} : ${error.message}`,
            'error'
          );
        }
      } else {
        DevLog(`ERREUR URL ${request.url}`, 'error');
        DevLog(`ERREUR UNHANDLED ${error}`, 'error');
      }

      reply.status(res.status).send(res);
    });
  }
}

const FastifyServer = new Server();

export default FastifyServer;
