import 'fastify';
import '@fastify/jwt';
import { IPermissions } from '@actunime/types';
import { User } from './_lib/media/_user';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      sub: string;
      email: string;
      preferred_username: string;
      roles: IPermissions[];
      discordID: string;
      groups: string;
    };
    user: User | null;
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    isTesting: boolean;
    logSession?: LogSession;
    mongooseSession: ClientSession;
    account?: {
      id: string;
      email: string;
      username: string;
      roles: IPermissions[];
    };
  }

  interface FastifyInstance {
    isTesting: boolean;
    authorize: (
      permissions: IPermissions[],
      strict?: boolean
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
