import {
  ICharacter,
  ICharacterDB,
  IMediaRelation,
  IDate,
  IMediaTitle,
  IPersonRelation,
  ICharacterGender,
  ICharacterSpecies,
} from '@actunime/types';
import { ClientSession } from 'mongoose';
import { CharacterModel, ModelDoc } from '../models';
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
> = Output<ICharacter, Character, J, E, A>;

export class Character extends ClassUtilSession implements ICharacter {
  public name: IMediaTitle;
  public age?: number;
  public birthDate?: IDate;
  public gender?: ICharacterGender;
  public species?: ICharacterSpecies;
  public description?: string;
  public avatar?: IMediaRelation;
  public actors?: IPersonRelation[];
  public id: string;
  public isVerified: boolean;

  constructor(
    data: Partial<ICharacter | ICharacterDB | ModelDoc<ICharacter>>,
    session: ClientSession | null = null
  ) {
    super(session);
    if (!data)
      throw new APIError('Character constructor data is empty', 'SERVER_ERROR');
    if (!data.name)
      throw new APIError('Character constructor name is empty', 'SERVER_ERROR');
    this.name = data.name;
    this.age = data.age;
    this.birthDate = data.birthDate;
    this.gender = data.gender;
    this.species = data.species;
    this.description = data.description;
    this.avatar = data.avatar;
    this.actors = data.actors;
    this.id = data.id;
    if (data.isVerified === undefined)
      throw new APIError(
        'Character constructor isVerified is empty',
        'SERVER_ERROR'
      );
    this.isVerified = data.isVerified;
  }

  Model() {
    return new CharacterModel(this.toJSON());
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
          `L'character avec l'id ${this.id} n'a pas pu etre sauvegardé`,
          'NOT_FOUND'
        );
      return null as Out<J, E>;
    }
    return (json ? this.toJSON() : this) as Out<J, E>;
  }

  async update<J extends boolean = true, E extends boolean = boolean>(
    options?: Omit<MethodOption<J, E>, 'cache'> & {
      upsert?: boolean;
      set?: Partial<ICharacter>;
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
    const update = await Character.cache(
      CharacterModel.findOneAndUpdate(
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
          `L'character avec l'id ${this.id} n'a pas pu etre mis à jour`,
          'NOT_FOUND'
        );
      return null as Out<J, E>;
    }

    mongooseCache.clear(this.id);
    const character = new Character(update.toObject(), session);
    return (json ? character.toJSON() : character) as Out<J, E>;
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
    const deleted = await CharacterModel.deleteOne(
      { id: this.id },
      { session }
    );
    if (!deleted.acknowledged || !deleted.deletedCount) {
      if (nullThrowErr)
        throw new APIError(
          `L'character avec l'id ${this.id} n'a pas pu etre supprimer`,
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
    return { id: this.id, path: 'Character' };
  }

  async getDBDiff() {
    const original = await Character.get(this.id, {
      cache: false,
      nullThrowErr: true,
    });
    const changes = DeepDiff.diff(original, this.toJSON());
    return { original, changes };
  }

  toJSON(): ICharacter {
    return {
      name: this.name,
      age: this.age,
      birthDate: this.birthDate,
      gender: this.gender,
      species: this.species,
      description: this.description,
      avatar: this.avatar,
      actors: this.actors,
      id: this.id,
      isVerified: this.isVerified,
    };
  }

  static async get<J extends boolean = true, E extends boolean = false>(
    id: string,
    options?: MethodOption<J, E>
  ): Promise<Out<J, E>> {
    DevLog(`Récupération de l'character ID: ${id}`, 'debug');
    const {
      json = true,
      cache = true,
      nullThrowErr = false,
      session,
    } = options || {};
    const res = await Character.cache(
      CharacterModel.findOne({ id }, null, { session }),
      id,
      session ? false : cache
    );
    DevLog(
      `Character ${res ? 'trouvée' : 'non trouvée'}, ID Character: ${id}`,
      'debug'
    );

    if (res) {
      const character = new Character(res.toObject(), session);
      return (json ? character.toJSON() : character) as Out<J, E>;
    }

    if (nullThrowErr)
      throw new APIError(
        `L'character avec l'identifiant ${id} n'a pas été trouvée`,
        'NOT_FOUND'
      );

    return null as Out<J, E>;
  }

  static async search<J extends boolean = true, E extends boolean = false>(
    filter: ICharacterDB,
    options?: MethodOption<J, E>
  ): Promise<Out<J, E, true>> {
    DevLog(`Recherche des characters...`, 'debug');
    const {
      json = true,
      cache = true,
      nullThrowErr = false,
      session,
    } = options || {};
    const res = await Character.cache(
      CharacterModel.find(filter, null, { session }),
      undefined,
      session ? false : cache
    );
    DevLog(`Characters trouvées: ${res.length}`, 'debug');

    if (res.length > 0) {
      return res.map((result) => {
        const character = new Character(result, session);
        return (json ? character.toJSON() : character) as Out<J, E>;
      }) as Out<J, E, true>;
    }

    if (nullThrowErr)
      throw new APIError(
        `La recherche des characters avec les filtre ${JSON.stringify(
          filter
        )} n'a pas renvoyé aucun resultat`,
        'NOT_FOUND'
      );

    return null as Out<J, E, true>;
  }
}
