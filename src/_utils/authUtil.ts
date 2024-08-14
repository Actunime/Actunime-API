import { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from 'fastify';
import { DevLog } from './logUtil';
import { UserModel } from '../_models';
import { IUser } from '../_types/userType';
import jwt, { JwtPayload, VerifyCallback } from 'jsonwebtoken';
import { IUserRoles, userPermissionIsHigherThan } from './userUtil';

declare module 'fastify' {
  export interface FastifyRequest {
    user: IUser;
    isFetchedUser?: boolean;
    getFullUser?: () => Promise<Partial<IUser> | undefined>;
  }
}

export const AuthValidation = (authorizedRoles?: IUserRoles | IUserRoles[]) => {
  return (req: FastifyRequest, res: FastifyReply, next: HookHandlerDoneFunction) => {
    const auth = new AuthUserMiddleware(authorizedRoles);
    auth.validate(req, res, next);
  };
};

export class AuthUserMiddleware {
  static UsersCache: Map<string, IUser> = new Map();

  req!: FastifyRequest;
  res!: FastifyReply;
  next!: HookHandlerDoneFunction;
  accessToken!: string;

  replied: boolean = false;
  user: IUser | undefined | null;
  roles: IUserRoles | IUserRoles[] = [];

  constructor(authorizedRoles?: IUserRoles | IUserRoles[]) {
    this.roles = authorizedRoles || [];
    this.validate = this.validate.bind(this);
  }

  public async validate(req: FastifyRequest, res: FastifyReply, next: HookHandlerDoneFunction) {
    const now = Date.now();
    DevLog('Début validation authentification');
    this.req = req;
    this.res = res;
    this.next = next;
    this.replied = false;
    this.user = undefined;
    this.accessToken = this.getToken(req.headers.authorization) || '';
    await this.authUser();
    this.verifyRoles();
    DevLog('Fin validation authentification ' + (Date.now() - now) + 'ms');
    this.end();
  }

  private block() {
    this.replied = true;
    this.res.status(401).send({
      error: 'Unauthorized'
    });
    DevLog('Utilisateur non authentifié');
  }

  private expired() {
    this.replied = true;
    this.res.status(401).send({
      error: 'Unauthorized',
      expiredToken: true
    });
    DevLog('Token expire');
  }

  private getToken(authorization?: string) {
    if (!authorization) {
      this.block();
      return;
    }

    const [type, token] = authorization.split(' ');

    if (type !== 'Bearer') {
      this.block();
      return;
    }

    return token;
  }

  public async authUser() {
    if (this.replied) return;

    DevLog("Authentification de l'utilisateur...");

    return new Promise((resolve: (value: void) => void) => {
      jwt.verify(this.accessToken, process.env.AUTH_SECRET as string, (async (err, value) => {
        if (err) {
          DevLog(err.message, 'error');
          if (err.name === 'TokenExpiredError') this.expired();
          else this.block();

          return resolve();
        }

        if (value instanceof Object) {
          const cachedUser = AuthUserMiddleware.UsersCache.get(value.userId);

          if (!value.updatedAt) {
            this.block();
            return resolve();
          }

          const cacheIsValid =
            cachedUser && cachedUser.updatedAt.getTime() === new Date(value.updatedAt).getTime();

          // Utilisation du cache pour réponse rapide sans attendre la base de donnée.
          if (cachedUser && cacheIsValid) {
            const user = cachedUser;
            this.user = user;
            this.req.user = user;

            DevLog("Cache authentifie l'utilisateur " + value.userId);
            return resolve();
          }

          DevLog("Récupération de l'utilisateur " + value.userId + ' ...');
          const findUser = await UserModel.findOne({ id: value.userId });

          if (!findUser) {
            this.block();
            return resolve();
          }

          const user = findUser.toJSON();

          AuthUserMiddleware.UsersCache.set(user.id, user);

          this.user = user;
          this.req.user = user;

          DevLog("Authentifie l'utilisateur " + value.userId);
        } else {
          this.block();
          return resolve();
        }

        resolve();
      }) satisfies VerifyCallback<
        JwtPayload | string | { userId: string; updatedAt: Date } | undefined
      >);
    });
  }

  public verifyRoles() {
    if (this.replied) return;

    const user = this.user!;
    const roles = this.roles!;

    if (Array.isArray(roles)) {
      if (!userPermissionIsHigherThan(user.roles, roles)) {
        DevLog('Unauthorized rôle permissions');
        this.block();
        return;
      }
    } else {
      if (!userPermissionIsHigherThan(user.roles, [roles])) {
        DevLog('Unauthorized rôle permissions');
        this.block();
        return;
      }
    }
  }

  public end() {
    if (!this.replied) {
      DevLog('Replied');
      this.replied = true;
      this.next();
    }
  }
}
