import { IUser, IUserRoles } from '@actunime/types';
import { APIError } from '../_lib/Error';
import { CheckRealmRoles, IRealmRole } from './_realmRoles';
import { ClientSession } from 'mongoose';
import LogSession from './_logSession';
import { DevLog } from '../_lib/logger';

type Out<Type, ClassType, J extends boolean, E extends boolean> = E extends true
  ? J extends true
    ? Type
    : ClassType
  : (J extends true ? Type : ClassType) | null;
export type Output<
  Type,
  ClassType,
  J extends boolean = true,
  E extends boolean = false,
  A extends boolean = false
> = A extends true
  ? Out<Type, ClassType, J, E>[] | null
  : Out<Type, ClassType, J, E>;

export class withBasic {
  public session: ClientSession | null = null;
  public log?: LogSession;
  constructor(session: ClientSession | null = null, log?: LogSession) {
    this.session = session;
    this.log = log;
  }
  public setSession(session: ClientSession | null) {
    this.session = session;
    return this;
  }
  public needSession(
    session?: ClientSession | null
  ): asserts session is ClientSession {
    if (!session)
      throw new APIError("La session n'a pas été fourni", 'SERVER_ERROR');
  }
  public useLog(log: LogSession | undefined) {
    this.log = log;
    return this;
  }
}

export class withUser extends withBasic {
  public user?: IUser;
  constructor(options?: {
    user?: IUser;
    log?: LogSession;
    session?: ClientSession | null;
  }) {
    super(options?.session, options?.log);
    this.user = options?.user;
  }

  public useUser(user: IUser) {
    this.user = user;
    return this;
  }

  public needUser(user?: IUser | null): asserts user is IUser {
    if (!this.user)
      throw new APIError(
        "Aucun n'utilisateur n'a été défini pour cette action",
        'UNAUTHORIZED'
      );
  }

  public needRoles(roles: IRealmRole[], strict?: boolean) {
    const hasRoles = CheckRealmRoles(roles, this.user!.roles, strict);
    if (!hasRoles)
      throw new APIError(
        "Vous n'avez pas les droits suffisant pour cette action",
        'UNAUTHORIZED'
      );
  }
}

export const UtilControllers = { withUser };
