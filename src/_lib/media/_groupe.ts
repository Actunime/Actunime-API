import {
  IGroupe,
  IGroupeDB,
  IMediaName,
} from '@actunime/types';
import { ClientSession } from 'mongoose';
import { GroupeModel, ModelDoc } from '../models';
import { APIError } from '../error';
import { DevLog } from '../logger';
import { Output } from '../../_utils/_controllers';
import { mongooseCache } from '../database';
import DeepDiff from 'deep-diff';
import { ClassUtilSession, MethodOption } from './util';

type Out<
  J extends boolean,
  E extends boolean,
  A extends boolean = false
> = Output<IGroupe, Groupe, J, E, A>;

export class Groupe extends ClassUtilSession implements IGroupe {
  public name: IMediaName;
  public id: string;
  public isVerified: boolean;

  constructor(
    data: Partial<IGroupe | IGroupeDB | ModelDoc<IGroupe>>,
    session: ClientSession | null = null
  ) {
    super(session);
    if (!data)
      throw new APIError('Groupe constructor data is empty', 'SERVER_ERROR');
    if (!data.name)
      throw new APIError('Groupe constructor name is empty', 'SERVER_ERROR');
    this.name = data.name;
    this.id = data.id;
    if (data.isVerified === undefined)
      throw new APIError(
        'Groupe constructor isVerified is empty',
        'SERVER_ERROR'
      );
    this.isVerified = data.isVerified;
  }

  Model() {
    return new GroupeModel(this.toJSON());
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
          `L'groupe avec l'id ${this.id} n'a pas pu etre sauvegardé`,
          'NOT_FOUND'
        );
      return null as Out<J, E>;
    }
    return (json ? this.toJSON() : this) as Out<J, E>;
  }

  async update<J extends boolean = true, E extends boolean = boolean>(
    options?: Omit<MethodOption<J, E>, 'cache'> & {
      upsert?: boolean;
      set?: Partial<IGroupe>;
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
    const update = await Groupe.cache(
      GroupeModel.findOneAndUpdate(
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
          `L'groupe avec l'id ${this.id} n'a pas pu etre mis à jour`,
          'NOT_FOUND'
        );
      return null as Out<J, E>;
    }

    mongooseCache.clear(this.id);
    const groupe = new Groupe(update.toObject(), session);
    return (json ? groupe.toJSON() : groupe) as Out<J, E>;
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
    const deleted = await GroupeModel.deleteOne({ id: this.id }, { session });
    if (!deleted.acknowledged || !deleted.deletedCount) {
      if (nullThrowErr)
        throw new APIError(
          `L'groupe avec l'id ${this.id} n'a pas pu etre supprimer`,
          'NOT_FOUND'
        );
      return null as Out<J, E>;
    }
    await mongooseCache.clear(this.id);
    return (json ? this.toJSON() : this) as Out<J, E>;
  }

  public async setVerified<J extends boolean = true, E extends boolean = false>(
    save?: boolean,
    updateOptions?: MethodOption<J, E>
  ) {
    this.isVerified = true;
    if (save)
      await this.update({ ...updateOptions, set: { isVerified: true } });
  }

  public async setUnverified<
    J extends boolean = true,
    E extends boolean = false
  >(save?: boolean, updateOptions?: MethodOption<J, E>) {
    this.isVerified = false;
    if (save)
      await this.update({ ...updateOptions, set: { isVerified: false } });
  }

  public asRelation() {
    return { id: this.id, path: 'Groupe' };
  }

  async getDBDiff() {
    const original = await Groupe.get(this.id, {
      cache: false,
      nullThrowErr: true,
    });
    const changes = DeepDiff.diff(original, this.toJSON());
    return { original, changes };
  }

  toJSON(): IGroupe {
    return {
      name: this.name,
      id: this.id,
      isVerified: this.isVerified,
    };
  }

  static async get<J extends boolean = true, E extends boolean = false>(
    id: string,
    options?: MethodOption<J, E>
  ): Promise<Out<J, E>> {
    DevLog(`Récupération de l'groupe ID: ${id}`, 'debug');
    const {
      json = true,
      cache = true,
      nullThrowErr = false,
      session,
    } = options || {};
    const res = await Groupe.cache(
      GroupeModel.findOne({ id }, null, { session }),
      id,
      session ? false : cache
    );
    DevLog(
      `Groupe ${res ? 'trouvée' : 'non trouvée'}, ID Groupe: ${id}`,
      'debug'
    );

    if (res) {
      const groupe = new Groupe(res.toObject(), session);
      return (json ? groupe.toJSON() : groupe) as Out<J, E>;
    }

    if (nullThrowErr)
      throw new APIError(
        `L'groupe avec l'identifiant ${id} n'a pas été trouvée`,
        'NOT_FOUND'
      );

    return null as Out<J, E>;
  }

  static async search<J extends boolean = true, E extends boolean = false>(
    filter: IGroupeDB,
    options?: MethodOption<J, E>
  ): Promise<Out<J, E, true>> {
    DevLog(`Recherche des groupes...`, 'debug');
    const {
      json = true,
      cache = true,
      nullThrowErr = false,
      session,
    } = options || {};
    const res = await Groupe.cache(
      GroupeModel.find(filter, null, { session }),
      undefined,
      session ? false : cache
    );
    DevLog(`Groupes trouvées: ${res.length}`, 'debug');

    if (res.length > 0) {
      return res.map((result) => {
        const groupe = new Groupe(result, session);
        return (json ? groupe.toJSON() : groupe) as Out<J, E>;
      }) as Out<J, E, true>;
    }

    if (nullThrowErr)
      throw new APIError(
        `La recherche des groupes avec les filtre ${JSON.stringify(
          filter
        )} n'a pas renvoyé aucun resultat`,
        'NOT_FOUND'
      );

    return null as Out<J, E, true>;
  }
}
