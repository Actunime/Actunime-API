import dotenv from 'dotenv';
dotenv.config({ path: [`.env.${process.env.NODE_ENV || 'development'}`, '.env.local'] });

import Fastify from 'fastify';
import { connectDB } from './_utils/mongoose';
import * as routes_v1 from '@/routes_v1';
import Fastify_RateLimit from '@fastify/rate-limit';
import Fastify_Cors from '@fastify/cors';
import { IUser } from './_types/userType';
import fastifyStatic from '@fastify/static';
import path from 'path';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import { PatchModel, PersonModel, ImageModel, UserModel, UserAccountModel } from './_models';
// import { UserAccountModel, UserModel } from './_models/_userModel';

declare module 'fastify' {
  export interface FastifyRequest {
    user: IUser;
    isFetchedUser?: boolean;
    getFullUser?: () => Promise<Partial<IUser> | undefined>;
  }
}

(async () => {
  const fastify = Fastify({
    logger: true
  });

  const checkOrigin = (url: string | undefined): boolean => {
    const hostname = url ? new URL(url).hostname : '';
    return ['localhost', 'actunime.fr'].includes(hostname);
  };

  fastify
    .register(Fastify_Cors, {
      origin: (origin, cb) => {
        if (checkOrigin(origin)) return cb(null, true);
        return cb(null, false);
      }
    })
    .register(Fastify_RateLimit, {
      global: false,
      max: 100,
      errorResponseBuilder: (req, context) => {
        return {
          code: 429,
          error: 'Too Many Requests',
          message: `Vous avez dépassé la limite de ${context.max} requêtes par ${context.after}, ressayer plus tard.`,
          date: Date.now(),
          expiresIn: context.ttl
        };
      }
    });

  try {
    await connectDB();

    // await UserModel.deleteMany();
    // await UserAccountModel.deleteMany();

    console.log(
      'Utilisateurs',
      (await UserModel.find()).map((user) => user.username + ' - ' + user.id).join('\n')
    );
    console.log('Images', (await ImageModel.find()).map((image) => image.id).join('\n'));

    const user = await UserModel.findOneAndReplace(
      {
        username: 'Actunime'
      },
      {
        id: 'actunime',
        username: 'Actunime',
        displayName: 'Actunime',
        roles: ['ACTUNIME']
      },
      { upsert: true, new: true }
    );

    await UserAccountModel.findOneAndReplace(
      { user: user._id },
      {
        user: user._id,
        userId: user.id,
        email: 'proxdevxkill@gmail.com'
      },
      { upsert: true, new: true }
    );

    // await PersonModel.deleteMany();
    // await ImageModel.deleteMany();
    // await PatchModel.deleteMany();

    for await (const [key, route] of Object.entries(routes_v1)) {
      await fastify.register(route, { prefix: '/v1' });
      console.log('Route', key, 'chargé!');
    }

    if (process.env.NODE_ENV === 'production') {
      const ImagePathRoot = '/actunime/img';
      fastify.register(fastifyStatic, {
        prefix: '/img',
        root: ImagePathRoot,
        setHeaders: (res, path, stat) => {
          res.setHeader('Cache-Control', 'public, max-age=604800');
          res.setHeader('ETag', stat.mtime.getTime().toString());
        }
      });
    } else {
      fastify.register(fastifyStatic, {
        prefix: '/img',
        root: path.join(__dirname, '..', 'img')
      });
    }

    console.log(fastify.printRoutes());

    await fastify.listen({ host: '0.0.0.0', port: parseInt(process.env.PORT || '3005') || 3005 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
})();
