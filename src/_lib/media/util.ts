import { ClientSession, Query } from 'mongoose';
import { CacheTTL } from 'ts-cache-mongoose';
import { APIError } from '../error';

export class ClassUtilSession {
  public session?: ClientSession | null = null;
  constructor(session?: ClientSession | null) {
    this.session = session;
  }
  needSession(
    session?: ClientSession | null
  ): asserts session is ClientSession {
    if (!session)
      throw new APIError("La session n'a pas été fourni", 'SERVER_ERROR');
  }
  public static async cache<T extends Query<any, any> = Query<any, any>>(
    query: T,
    key?: string,
    cache: CacheTTL | boolean = '60m'
  ) {
    if (cache) query.cache((typeof cache === 'string' && cache) || '60m', key);
    return await query;
  }
}

export type MethodOption<J extends boolean, E extends boolean> = {
  json?: J;
  cache?: CacheTTL | boolean;
  nullThrowErr?: E;
  session?: ClientSession | null;
};
