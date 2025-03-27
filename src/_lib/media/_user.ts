import {
  IUser,
  IUserDB,
  IMediaRelation,
  IUserOptions,
  IPermissions,
  IUserPaginationResponse,
} from '@actunime/types';
import { ClientSession } from 'mongoose';
import { UserModel, ModelDoc } from '../models';
import { APIError } from '../error';
import { DevLog } from '../logger';
import { Output } from '../../_utils/_controllers';
import { mongooseCache } from '../database';
import DeepDiff from 'deep-diff';
import { ClassUtilSession, MethodOption } from './util';
import { IUserPaginationBody } from '@actunime/validations';
import { PaginationControllers } from '../../controllers/pagination.controllers';

type Out<
  J extends boolean,
  E extends boolean,
  A extends boolean = false
> = Output<IUser, User, J, E, A>;

export class User extends ClassUtilSession implements IUser {
  public accountId: string;
  public username: string;
  public displayName: string;
  public description?: string;
  public permissions: IPermissions[];
  public avatar?: IMediaRelation;
  public banner?: IMediaRelation;
  public options?: IUserOptions;
  public id: string;

  constructor(
    data: Partial<IUser | IUserDB | ModelDoc<IUser>> & Required<{ id: string }>,
    session: ClientSession | null = null
  ) {
    super(session);
    if (!data)
      throw new APIError('User constructor data is empty', 'SERVER_ERROR');
    if (!data.accountId)
      throw new APIError('User constructor accountId is empty', 'SERVER_ERROR');
    this.accountId = data.accountId;
    if (!data.username)
      throw new APIError('User constructor username is empty', 'SERVER_ERROR');
    this.username = data.username;
    if (!data.displayName)
      throw new APIError(
        'User constructor displayName is empty',
        'SERVER_ERROR'
      );
    this.displayName = data.displayName;
    this.description = data.description;
    if (!data.permissions)
      throw new APIError(
        'User constructor permissions is empty',
        'SERVER_ERROR'
      );
    this.permissions = data.permissions;
    this.avatar = data.avatar;
    this.banner = data.banner;
    this.options = data.options;
    if (!data.id)
      throw new APIError('User constructor id is empty', 'SERVER_ERROR');
    this.id = data.id;
  }

  Model() {
    return new UserModel(this.toJSON());
  }

  async save<J extends boolean = true, E extends boolean = false>(
    options?: MethodOption<J, E>
  ): Promise<Out<J, E>> {
    const {
      json = true,
      nullThrowErr = false,
      session = this.session,
    } = options || {};
    this.needSession(session);
    const saved = await this.Model().save({ session });
    if (!saved) {
      if (nullThrowErr)
        throw new APIError(
          `L'user avec l'id ${this.id} n'a pas pu etre sauvegardé`,
          'NOT_FOUND'
        );
      return null as Out<J, E>;
    }
    return (json ? this.toJSON() : this) as Out<J, E>;
  }

  async update<J extends boolean = true, E extends boolean = boolean>(
    options?: Omit<MethodOption<J, E>, 'cache'> & {
      upsert?: boolean;
      set?: Partial<IUser>;
    }
  ): Promise<Out<J, E>> {
    const {
      json = true,
      nullThrowErr = false,
      session = this.session,
      set,
      upsert,
    } = options || {};
    this.needSession(session);
    const update = await User.cache(
      UserModel.findOneAndUpdate(
        { id: this.id },
        set ? { $set: set } : this.toJSON(),
        { session, upsert, new: true, runValidators: true }
      ),
      this.id,
      false
    );

    if (!update) {
      if (nullThrowErr)
        throw new APIError(
          `L'user avec l'id ${this.id} n'a pas pu etre mis à jour`,
          'NOT_FOUND'
        );
      return null as Out<J, E>;
    }

    mongooseCache.clear(this.id);
    const user = new User(update.toObject(), session);
    return (json ? user.toJSON() : user) as Out<J, E>;
  }

  async delete<J extends boolean = true, E extends boolean = false>(
    options: MethodOption<J, E>
  ): Promise<Out<J, E>> {
    const {
      json = true,
      nullThrowErr = false,
      session = this.session,
    } = options || {};
    this.needSession(session);
    const deleted = await UserModel.deleteOne({ id: this.id }, { session });
    if (!deleted.acknowledged || !deleted.deletedCount) {
      if (nullThrowErr)
        throw new APIError(
          `L'user avec l'id ${this.id} n'a pas pu etre supprimer`,
          'NOT_FOUND'
        );
      return null as Out<J, E>;
    }
    await mongooseCache.clear(this.id);
    return (json ? this.toJSON() : this) as Out<J, E>;
  }

  public asRelation() {
    return { id: this.id, path: 'User' };
  }

  async getDBDiff() {
    const original = await User.get(this.id, {
      cache: false,
      nullThrowErr: true,
    });
    const changes = DeepDiff.diff(original, this.toJSON());
    return { original, changes };
  }

  toJSON(): IUser {
    return {
      accountId: this.accountId,
      username: this.username,
      displayName: this.displayName,
      description: this.description,
      permissions: this.permissions,
      avatar: this.avatar,
      banner: this.banner,
      options: this.options,
      id: this.id,
    };
  }

  static async get<J extends boolean = true, E extends boolean = false>(
    id: string,
    options?: MethodOption<J, E>
  ): Promise<Out<J, E>> {
    DevLog(`Récupération de l'user ID: ${id}`, 'debug');
    const {
      json = true,
      cache = true,
      nullThrowErr = false,
      session,
    } = options || {};
    const res = await User.cache(
      UserModel.findOne({ id }, null, { session }),
      id,
      session ? false : cache
    );
    DevLog(`User ${res ? 'trouvée' : 'non trouvée'}, ID User: ${id}`, 'debug');

    if (res) {
      const user = new User(res.toObject(), session);
      return (json ? user.toJSON() : user) as Out<J, E>;
    }

    if (nullThrowErr)
      throw new APIError(
        `L'user avec l'identifiant ${id} n'a pas été trouvée`,
        'NOT_FOUND'
      );

    return null as Out<J, E>;
  }

  static async getByAccount<
    J extends boolean = true,
    E extends boolean = false
  >(id: string, options?: MethodOption<J, E>): Promise<Out<J, E>> {
    DevLog(`Récupération de l'user ID: ${id}`, 'debug');
    const {
      json = true,
      cache = true,
      nullThrowErr = false,
      session,
      message,
    } = options || {};
    const res = await User.cache(
      UserModel.findOne({ accountId: id }, null, { session }),
      id,
      session ? false : cache
    );
    DevLog(`User ${res ? 'trouvée' : 'non trouvée'}, ID User: ${id}`, 'debug');

    if (res) {
      const user = new User(res.toObject(), session);
      return (json ? user.toJSON() : user) as Out<J, E>;
    }

    if (nullThrowErr)
      throw new APIError(
        message || `L'user avec l'identifiant ${id} n'a pas été trouvée`,
        'NOT_FOUND'
      );

    return null as Out<J, E>;
  }

  static async search<J extends boolean = true, E extends boolean = false>(
    filter: IUserDB,
    options?: MethodOption<J, E>
  ): Promise<Out<J, E, true>> {
    DevLog(`Recherche des users...`, 'debug');
    const {
      json = true,
      cache = true,
      nullThrowErr = false,
      session,
    } = options || {};
    const res = await User.cache(
      UserModel.find(filter, null, { session }),
      undefined,
      session ? false : cache
    );
    DevLog(`Users trouvées: ${res.length}`, 'debug');

    if (res.length > 0) {
      return res.map((result) => {
        const user = new User(result, session);
        return (json ? user.toJSON() : user) as Out<J, E>;
      }) as Out<J, E, true>;
    }

    if (nullThrowErr)
      throw new APIError(
        `La recherche des users avec les filtre ${JSON.stringify(
          filter
        )} n'a pas renvoyé aucun resultat`,
        'NOT_FOUND'
      );

    return null as Out<J, E, true>;
  }

  static async pagination(
    pageFilter?: Partial<IUserPaginationBody>
  ): Promise<IUserPaginationResponse> {
    DevLog(`Pagination des users...`, 'debug');
    const pagination = new PaginationControllers(UserModel);

    pagination.useFilter(pageFilter);

    const res = await pagination.getResults();
    res.results = res.results.map((result) => new User(result).toJSON());

    DevLog(`Users trouvées: ${res.resultsCount}`, 'debug');
    return res;
  }
}
