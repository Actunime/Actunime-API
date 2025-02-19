import dotenv from 'dotenv';
dotenv.config({
  path: [`.env.${process.env.NODE_ENV || 'development'}`.trim()],
});

import Fastify from 'fastify';
import { DevLog } from '@actunime/utils';
import { connectDB, SendOnlineMessage } from "./_utils";
import * as routes_v1 from './routes_v1/index.js';
import Fastify_RateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { IUser } from '@actunime/types';
import fastifyJwt from '@fastify/jwt';
import fastifyFormbody from '@fastify/formbody';
import fs from 'fs';
import { Auth_Routes_V1 } from './auth_routes/routes';
import mongoose, { ClientSession } from 'mongoose';
import { activesSessions, removeSessionHandler } from './_utils/_mongooseSession.js';
import { APIError } from './_lib/Error.js';
import { Services } from './_utils/_services.js';

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
  let key: Buffer<ArrayBufferLike> | undefined = undefined;
  let cert: Buffer<ArrayBufferLike> | undefined = undefined;

  await new Promise((resolve) => {
    fs.readFile(path.join(__dirname, '..', 'https', 'key.pem'), (err, data) => {
      if (!err)
        key = data;
      resolve(null);
    });
  })

  await new Promise((resolve) => {
    fs.readFile(path.join(__dirname, '..', 'https', 'cert.pem'), (err, data) => {
      if (!err)
        cert = data;
      resolve(null);
    });
  });

  const fastify = Fastify({
    logger: true,
    // http2: true,
    bodyLimit: 30 * 1024 * 1024, // 30 MB
    ...process.env.NODE_ENV !== 'production' ? {
      https: {
        key,
        cert
      }
    } : {}
  });


  fastify
    .register(fastifyStatic, {
      root: path.join(__dirname, '..', 'public')
    })
    // .register(Fastify_Cors, {
    //   origin: (origin, cb) => {
    //     const checkOrigin = (url: string | undefined): boolean => {
    //       const hostname = url ? new URL(url).hostname : '';
    //       return ['localhost', 'actunime.fr'].includes(hostname);
    //     };
    //     if (checkOrigin(origin))
    //       return cb(null, true);
    //     console.log("Origin", origin, "ERRRUR BLOQUAGE");
    //     return cb(null, false);
    //   },
    // })
    .register(Fastify_RateLimit, {
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

  fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET!,
  });

  await fastify.register(fastifyFormbody);

  fastify.setErrorHandler((error, request, reply) => {
    if (error instanceof APIError) {
      DevLog(`APIError ${error.code} : ${error.message}`, 'error');
      reply.status(error.status || 500).send({
        statusCode: error.status || 500,
        error: error.code,
        message: error.message
      });
      return;
    }
    // Formater l'erreur
    DevLog(`ERREUR URL ${request.url}`, 'error');
    DevLog(`ERREUR UNHANDLED ${error.statusCode} : ${error.message}`, 'error');
    console.error(error);
    const formattedError = {
      statusCode: error.statusCode || 500,
      error: error.name,
      message: error.message
    };
    reply.status(formattedError.statusCode).send(formattedError);
  });

  fastify.register(Auth_Routes_V1);

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

    for await (const [key, route] of Object.entries(routes_v1)) {
      await fastify.register(route, { prefix: '/v1' });
      console.log('Route', key, 'chargé!');
    }

    fastify.addHook('onResponse', removeSessionHandler);

    new Services().start();

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
