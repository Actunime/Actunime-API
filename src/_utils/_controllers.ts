import { APIError } from '../_lib/error';
import { ClientSession } from 'mongoose';
import LogSession from './_logSession';

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
  ? E extends true
    ? Out<Type, ClassType, J, E>[]
    : Out<Type, ClassType, J, E>[] | null
  : Out<Type, ClassType, J, E>;

export class withBasic {
  public session: ClientSession;
  public log?: LogSession;
  constructor(
    session: ClientSession,
    options?: { log?: LogSession }
  ) {
    this.session = session;
    this.log = options?.log;
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

export const UtilControllers = { withBasic };
