import {
  IPerson,
  IPersonDB,
  IMediaLink,
  IMediaRelation,
  IMediaName,
  IDate,
  IPersonPaginationResponse,
} from '@actunime/types';
import { ClientSession } from 'mongoose';
import { PersonModel, ModelDoc } from '../models';
import { APIError } from '../error';
import { DevLog } from '../logger';
import { Output } from '../../_utils/_controllers';
import { mongooseCache } from '../database';
import DeepDiff from 'deep-diff';
import { ClassUtilSession, MethodOption } from './util';
import { IPersonPaginationBody } from '@actunime/validations';
import { PaginationControllers } from '../../controllers/pagination.controllers';

type Out<
  J extends boolean,
  E extends boolean,
  A extends boolean = false
> = Output<IPerson, Person, J, E, A>;

export class Person extends ClassUtilSession implements IPerson {
  public name: IMediaName;
  public birthDate?: IDate;
  public deathDate?: IDate;
  public description?: string;
  public avatar?: IMediaRelation;
  public links?: IMediaLink[];
  public isGroupe?: boolean;
  public id: string;
  public isVerified: boolean;

  constructor(
    data: Partial<IPerson | IPersonDB | ModelDoc<IPerson>> &
      Required<{ id: string }>,
    session: ClientSession | null = null
  ) {
    super(session);
    if (!data)
      throw new APIError('Person constructor data is empty', 'SERVER_ERROR');
    if (!data.name)
      throw new APIError('Person constructor name is empty', 'SERVER_ERROR');
    this.name = data.name;
    this.birthDate = data.birthDate;
    this.deathDate = data.deathDate;
    this.description = data.description;
    this.avatar = data.avatar;
    this.links = data.links;
    this.isGroupe = data.isGroupe;
    if (!data?.id)
      throw new APIError('Person constructor id is empty', 'SERVER_ERROR');
    this.id = data.id;
    if (data.isVerified === undefined)
      throw new APIError(
        'Person constructor isVerified is empty',
        'SERVER_ERROR'
      );
    this.isVerified = data.isVerified;
  }

  Model() {
    return new PersonModel(this.toJSON());
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
          `L'person avec l'id ${this.id} n'a pas pu etre sauvegardé`,
          'NOT_FOUND'
        );
      return null as Out<J, E>;
    }
    return (json ? this.toJSON() : this) as Out<J, E>;
  }

  async update<J extends boolean = true, E extends boolean = boolean>(
    options?: Omit<MethodOption<J, E>, 'cache'> & {
      upsert?: boolean;
      set?: Partial<IPerson>;
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
    const update = await Person.cache(
      PersonModel.findOneAndUpdate(
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
          `L'person avec l'id ${this.id} n'a pas pu etre mis à jour`,
          'NOT_FOUND'
        );
      return null as Out<J, E>;
    }

    mongooseCache.clear(this.id);
    const person = new Person(update.toObject(), session);
    return (json ? person.toJSON() : person) as Out<J, E>;
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
    const deleted = await PersonModel.deleteOne({ id: this.id }, { session });
    if (!deleted.acknowledged || !deleted.deletedCount) {
      if (nullThrowErr)
        throw new APIError(
          `L'person avec l'id ${this.id} n'a pas pu etre supprimer`,
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
    return { id: this.id, path: 'Person' };
  }

  async getDBDiff() {
    const original = await Person.get(this.id, {
      cache: false,
      nullThrowErr: true,
    });
    const changes = DeepDiff.diff(original, this.toJSON());
    return { original, changes };
  }

  toJSON(): IPerson {
    return {
      name: this.name,
      birthDate: this.birthDate,
      deathDate: this.deathDate,
      description: this.description,
      avatar: this.avatar,
      links: this.links,
      isGroupe: this.isGroupe,
      id: this.id,
      isVerified: this.isVerified,
    };
  }

  static async get<J extends boolean = true, E extends boolean = false>(
    id: string,
    options?: MethodOption<J, E>
  ): Promise<Out<J, E>> {
    DevLog(`Récupération de l'person ID: ${id}`, 'debug');
    const {
      json = true,
      cache = true,
      nullThrowErr = false,
      session,
    } = options || {};
    const res = await Person.cache(
      PersonModel.findOne({ id }, null, { session }),
      id,
      session ? false : cache
    );
    DevLog(
      `Person ${res ? 'trouvée' : 'non trouvée'}, ID Person: ${id}`,
      'debug'
    );

    if (res) {
      const person = new Person(res.toObject(), session);
      return (json ? person.toJSON() : person) as Out<J, E>;
    }

    if (nullThrowErr)
      throw new APIError(
        `L'person avec l'identifiant ${id} n'a pas été trouvée`,
        'NOT_FOUND'
      );

    return null as Out<J, E>;
  }

  static async search<J extends boolean = true, E extends boolean = false>(
    filter: IPersonDB,
    options?: MethodOption<J, E>
  ): Promise<Out<J, E, true>> {
    DevLog(`Recherche des persons...`, 'debug');
    const {
      json = true,
      cache = true,
      nullThrowErr = false,
      session,
    } = options || {};
    const res = await Person.cache(
      PersonModel.find(filter, null, { session }),
      undefined,
      session ? false : cache
    );
    DevLog(`Persons trouvées: ${res.length}`, 'debug');

    if (res.length > 0) {
      return res.map((result) => {
        const person = new Person(result, session);
        return (json ? person.toJSON() : person) as Out<J, E>;
      }) as Out<J, E, true>;
    }

    if (nullThrowErr)
      throw new APIError(
        `La recherche des persons avec les filtre ${JSON.stringify(
          filter
        )} n'a pas renvoyé aucun resultat`,
        'NOT_FOUND'
      );

    return null as Out<J, E, true>;
  }

  static async pagination(
    pageFilter?: Partial<IPersonPaginationBody>
  ): Promise<IPersonPaginationResponse> {
    DevLog(`Pagination des persons...`, 'debug');
    const pagination = new PaginationControllers(PersonModel);

    pagination.useFilter(pageFilter);

    const res = await pagination.getResults();
    res.results = res.results.map((result) => new Person(result).toJSON());

    DevLog(`Persons trouvées: ${res.resultsCount}`, 'debug');
    return res;
  }
}
