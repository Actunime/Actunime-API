import { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from "fastify";
import { DevLog } from "@actunime/utils";
import { AccessTokenModel } from "@actunime/mongoose-models";
import { IUser, IUserRoles, userPermissionIsHigherThan } from "@actunime/types";
import jwt from "jsonwebtoken";
import { UserManager } from "./user";
import mongoose from "mongoose";

declare module "fastify" {
  export interface FastifyRequest {
    user: { userId: string };
    currentUser?: IUser;
    isFetchedUser?: boolean;
    getFullUser?: () => Promise<Partial<IUser> | undefined>;
  }
}

export const AuthValidation = (authorizedRoles?: IUserRoles | IUserRoles[], forceClientAuth = true, blockIfUnauthorized = true) => {
  return (
    req: FastifyRequest,
    res: FastifyReply,
    next: HookHandlerDoneFunction,
  ) => {
    // next()
    const auth = new AuthUserMiddleware(authorizedRoles, forceClientAuth, blockIfUnauthorized);
    auth.validate(req, res, next);
  };
};

export class AuthUserMiddleware {
  static UsersCache: Map<string, IUser> = new Map();

  req!: FastifyRequest;
  res!: FastifyReply;
  next!: HookHandlerDoneFunction;
  accessToken!: string;
  forceClientAuth = true;
  blockIfUnauthorized = true;

  replied: boolean = false;
  user: IUser | undefined | null;
  roles: IUserRoles | IUserRoles[] = [];

  constructor(authorizedRoles?: IUserRoles | IUserRoles[], forceClientAuth = true, blockIfUnauthorized = true) {
    this.roles = authorizedRoles || [];
    this.validate = this.validate.bind(this);
    this.forceClientAuth = forceClientAuth;
    this.blockIfUnauthorized = blockIfUnauthorized;
  }

  public async validate(
    req: FastifyRequest,
    res: FastifyReply,
    next: HookHandlerDoneFunction,
  ) {
    const now = Date.now();
    DevLog("Début validation authentification");
    this.req = req;
    this.res = res;
    this.next = next;
    this.replied = false;
    this.user = undefined;
    const clientAuth = req.headers["x-app-token"] as string;
    const isBot = req.headers["x-is-bot"] as string;
    DevLog(clientAuth + " x-app-token ");
    if (this.forceClientAuth) {
      if (!clientAuth) {
        DevLog("Force client authentification fail", "error");
        this.block();
        return;
      }

      if (isBot) {
        try {
          const verify = jwt.verify(isBot, process.env.BOT_SECRET as string) as { clientId: string };
          DevLog(`Client BOT (ID: ${verify.clientId}) authentification ` + (Date.now() - now) + "ms");
        } catch (err) {
          console.error(err);
          DevLog("Force client BOT authentification fail", "error");
          this.block();
          return
        }
      } else {

        try {
          const verify = jwt.verify(clientAuth, process.env.JWT_SECRET as string) as { clientId: string };
          DevLog(`Client (ID: ${verify.clientId}) authentification ` + (Date.now() - now) + "ms");
        } catch (err) {
          console.error(err);
          DevLog("Force client authentification fail", "error");
          this.block();
          return
        }
      }

    }

    await this.checkTokenIsAlive(this.req.headers.authorization);
    if (!this.req.user?.userId) {
      this.block();
      this.end();
      return;
    }

    await this.authUser();
    this.verifyRoles();
    DevLog("Fin validation authentification " + (Date.now() - now) + "ms");
    this.end();
  }

  private block() {
    DevLog("Utilisateur non authentifié", "warn");

    if (!this.blockIfUnauthorized) {
      this.end();
      return;
    }

    this.replied = true;
    this.res.status(401).send({
      error: "Unauthorized",
    });
  }

  private expired() {
    if (!this.blockIfUnauthorized) {
      this.end();
      return;
    }
    this.replied = true;
    this.res.status(401).send({
      error: "Unauthorized",
      expiredToken: true,
    });
    DevLog("Token expire", "warn");
  }

  private async checkTokenIsAlive(authorization?: string) {
    try {
      if (!authorization) {
        this.block();
        return;
      }

      await this.req.jwtVerify();

      const [type, token] = authorization.split(" ");

      if (type !== "Bearer") {
        this.block();
        return;
      }

      const findToken = await AccessTokenModel.findOneAndUpdate({ token }, { lastActivity: new Date() });
      if (!findToken) {
        this.expired();
        return;
      }

      return token;
    } catch (err) {
      console.error(err);
      this.block();
    }
  }

  public async authUser() {
    if (this.replied) return;

    DevLog("Authentification de l'utilisateur...");

    if (!this.req?.user?.userId)
      return this.block();

    return new Promise((resolve: (value: void) => void) => {

      DevLog("Récupération de l'utilisateur " + this.req?.user?.userId + " ...");

      const authUser = async () => {
        const session = await mongoose.startSession();
        try {
          session.startTransaction();

          const userManager = new UserManager(session, {});
          const user = await userManager.get(this.req.user.userId, {
            avatar: true,
            banner: true
          });

          if (user) {
            this.user = user;
            this.req.currentUser = user;
            await session.commitTransaction();
            DevLog("Authentifie l'utilisateur " + user.id);
          } else {
            DevLog("Utilisateur non trouvé", "error");
            this.block();
          }

          await session.endSession();

        } catch (err) {
          await session.abortTransaction();
          console.error(err);
          this.block();
        }
        resolve();
      }
      authUser();
    })
  }

  public verifyRoles() {
    if (this.replied) return;

    const user = this.user;
    if (!user) {
      return this.block();
    }

    const roles = this.roles!;

    if (Array.isArray(roles)) {
      if (!userPermissionIsHigherThan(user.roles, roles)) {
        DevLog("Unauthorized rôle permissions", "error");
        this.block();
        return;
      }
    } else {
      if (!userPermissionIsHigherThan(user.roles, [roles])) {
        DevLog("Unauthorized rôle permissions", "error");
        this.block();
        return;
      }
    }
  }

  public end() {
    if (!this.replied) {
      DevLog("Replied");
      this.replied = true;
      this.next();
    }
  }
}
