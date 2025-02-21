import dotenv from 'dotenv';
dotenv.config({
  path: [`.env.${process.env.NODE_ENV || 'development'}`.trim()],
});

import Fastify from 'fastify';
import { DevLog } from '@actunime/utils';
import { connectDB, SendOnlineMessage } from "./_utils";
import fastifyStatic from '@fastify/static';
import path from 'path';
import { IUser } from '@actunime/types';
import fastifyFormbody from '@fastify/formbody';
import fs from 'fs';
import mongoose, { ClientSession } from 'mongoose';
import { activesSessions, removeSessionHandler } from './_utils/_mongooseSession.js';
import { APIError } from './_lib/Error.js';
import UserRoutes from './routes/user.routes';
import cache from 'ts-cache-mongoose';
import { APIResponse } from './_utils/_response';
import AuthRoutes from './routes/auth.routes';
import { ZodError } from 'zod';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { version } from "../package.json";
import AccountRoutes from './routes/account.routes';
import {
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import AnimeRoutes from './routes/anime.routes';
import fastifyCors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';

declare module 'fastify' {
  interface FastifyRequest {
    user: { userId: string };
    currentUser?: IUser;
    isFetchedUser?: boolean;
    getFullUser?: () => Promise<Partial<IUser> | undefined>;
    session: ClientSession
  }

  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }
}

(async () => {

  const fastify = Fastify({
    logger: true,
    bodyLimit: 30 * 1024 * 1024, // 30 MB
  });

  cache.init(mongoose, {
    defaultTTL: '60 seconds',
    engine: "memory",
    debug: process.env.NODE_ENV !== "production",
  })

  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Actunime API',
        description: 'Actunime API (fastify swagger api doc)',
        version
      },
      servers: [
        {
          url: 'http://localhost:' + parseInt(process.env.PORT as string),
          description: 'Development server'
        }
      ],
      tags: [
        { name: 'Auth', description: 'Auth end-points' },
        { name: 'Account', description: 'Account end-points' },
        { name: 'User', description: 'User end-points' },
        { name: "Anime", description: 'Anime end-points' }
      ],
      components: {
        securitySchemes: {
          authorization: {
            type: "http",
            scheme: "bearer",
          }
        }
      },
      externalDocs: {
        url: 'https://discord.gg/TJuKYa694n',
        description: 'Actunime Discord'
      }
    },
    transform: jsonSchemaTransform
  })

  await fastify.register(fastifySwaggerUi, {
    logo: {
      type: "image/png",
      content: fs.readFileSync(path.join(__dirname, "..", "public", "logo.png")),
      href: "/doc",
      target: '_blank'
    },
    routePrefix: '/doc',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false
    },
    staticCSP: true
  })

  fastify
    .register(fastifyStatic, {
      root: path.join(__dirname, '..', 'public')
    })
    .register(fastifyCors, {
      origin: (origin, cb) => {
        const checkOrigin = (url: string | undefined): boolean => {
          const hostname = url ? new URL(url).hostname : '';
          return ['localhost', 'actunime.fr'].includes(hostname);
        };
        if (checkOrigin(origin))
          return cb(null, true);
        console.log("Origin", origin, "ERRRUR BLOQUAGE");
        return cb(null, false);
      },
    })
    .register(fastifyRateLimit, {
      global: false,
      max: 100,
      errorResponseBuilder: (req, context) => {
        return {
          code: 429,
          error: 'Too Many Requests',
          message: `Vous avez dépassé la limite de ${context.max} requêtes par ${context.after}, ressayer plus tard.`,
          date: Date.now(),
          expiresIn: context.ttl,
        };
      },
    });

  await fastify.register(fastifyFormbody);

  fastify.setErrorHandler((error, request, reply) => {
    if (error instanceof APIError) {
      DevLog(`APIError ${error.code} : ${error.message}`, 'error');
      reply.status(error.status || 500).send(new APIResponse({
        success: false,
        code: error.code,
        error: error.message,
        message: error.message,
        status: error.status
      }));
      return;
    }

    if (error instanceof ZodError) {
      DevLog(`ZodError : ${error.message}`, 'error');
      reply.status(400).send(new APIResponse({
        success: false,
        code: "BAD_REQUEST",
        error: error.message,
        message: error.message,
        status: 400
      }));
      return;
    }

    if (hasZodFastifySchemaValidationErrors(error)) {
      return reply.code(400).send(new APIResponse({
        success: false,
        code: "BAD_REQUEST",
        error: error.message,
        message: error.message,
        status: 400
      }))
    }

    if (isResponseSerializationError(error)) {
      return reply.code(500).send(new APIResponse({
        success: false,
        code: "BAD_RESPONSE",
        error: error.message,
        message: error.message,
        status: 400
      }))
    }

    DevLog(`ERREUR URL ${request.url}`, 'error');
    DevLog(`ERREUR UNHANDLED ${error.statusCode} : ${error.message}`, 'error');
    console.error(error);
    reply.status(error.statusCode || 500).send(new APIResponse({
      success: false,
      code: "SERVER_ERROR",
      error: error.message,
      message: error.message,
      status: error.statusCode || 500
    }));
  });

  fastify.addContentTypeParser('application/json', { parseAs: 'string' }, function (req, body: string, done) {
    try {
      const json = JSON.parse(body)
      done(null, json)
    } catch (err) {
      const error = err as any;
      error.statusCode = 400
      done(error, undefined)
    }
  })

  try {

    await connectDB(process.env.MONGODB_user, process.env.MONGODB_pass, process.env.MONGODB_dbName);

    await fastify.register(AuthRoutes, { prefix: "/auth" });
    await fastify.register(UserRoutes, { prefix: "/v1/users", });
    await fastify.register(AccountRoutes, { prefix: "/v1/accounts" });
    await fastify.register(AnimeRoutes, { prefix: "/v1/animes" })

    fastify.addHook('onResponse', removeSessionHandler);

    console.log(fastify.printRoutes())

    if (process.env.PORT) {
      await fastify.listen({
        host: process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost',
        port: parseInt(process.env.PORT),
      });
      if (process.env.NODE_ENV === 'production' && !process.env.BUILD_TEST)
        await SendOnlineMessage();
    } else {
      throw new Error('Missing PORT env variable');
    }

  } catch (err) {
    console.error(err);
    fastify.log.error(err);
    process.exit(1);
  }

})();

process.on('SIGINT', async function () {
  try {
    for await (const [_, session] of activesSessions) {
      await session.abortTransaction();
      await session.endSession();
    }
    await mongoose.connection.close()
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})
