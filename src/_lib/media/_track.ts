import {
  ITrack,
  ITrackDB,
  IMediaLink,
  IMediaRelation,
  IDate,
  ITrackType,
  IMediaTitle,
  IPersonRelation,
  ITrackPaginationResponse,
} from '@actunime/types';
import { ClientSession } from 'mongoose';
import { TrackModel, ModelDoc } from '../models';
import { APIError } from '../error';
import { DevLog } from '../logger';
import { Output } from '../../_utils/_controllers';
import { mongooseCache } from '../database';
import DeepDiff from 'deep-diff';
import { ClassUtilSession, MethodOption } from './util';
import { ITrackPaginationBody } from '@actunime/validations';
import { PaginationControllers } from '../../controllers/pagination.controllers';

type Out<
  J extends boolean,
  E extends boolean,
  A extends boolean = false
> = Output<ITrack, Track, J, E, A>;

export class Track extends ClassUtilSession implements ITrack {
  public type: ITrackType;
  public name: IMediaTitle;
  public releaseDate?: IDate;
  public description?: string;
  public cover?: IMediaRelation;
  public artists?: IPersonRelation[];
  public links?: IMediaLink[];
  public id: string;
  public isVerified: boolean;

  constructor(
    data: Partial<ITrack | ITrackDB | ModelDoc<ITrack>>,
    session: ClientSession | null = null
  ) {
    super(session);
    if (!data)
      throw new APIError('Track constructor data is empty', 'SERVER_ERROR');
    if (!data.type)
      throw new APIError('Track constructor type is empty', 'SERVER_ERROR');
    this.type = data.type;
    if (!data.name)
      throw new APIError('Track constructor name is empty', 'SERVER_ERROR');
    this.name = data.name;
    this.releaseDate = data.releaseDate;
    this.description = data.description;
    this.artists = data.artists;
    this.cover = data.cover;
    this.links = data.links;
    this.id = data.id;
    if (data.isVerified === undefined)
      throw new APIError(
        'Track constructor isVerified is empty',
        'SERVER_ERROR'
      );
    this.isVerified = data.isVerified;
  }

  Model() {
    return new TrackModel(this.toJSON());
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
          `L'track avec l'id ${this.id} n'a pas pu etre sauvegardé`,
          'NOT_FOUND'
        );
      return null as Out<J, E>;
    }
    return (json ? this.toJSON() : this) as Out<J, E>;
  }

  async update<J extends boolean = true, E extends boolean = boolean>(
    options?: Omit<MethodOption<J, E>, 'cache'> & {
      upsert?: boolean;
      set?: Partial<ITrack>;
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
    const update = await Track.cache(
      TrackModel.findOneAndUpdate(
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
          `L'track avec l'id ${this.id} n'a pas pu etre mis à jour`,
          'NOT_FOUND'
        );
      return null as Out<J, E>;
    }

    mongooseCache.clear(this.id);
    const track = new Track(update.toObject(), session);
    return (json ? track.toJSON() : track) as Out<J, E>;
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
    const deleted = await TrackModel.deleteOne({ id: this.id }, { session });
    if (!deleted.acknowledged || !deleted.deletedCount) {
      if (nullThrowErr)
        throw new APIError(
          `L'track avec l'id ${this.id} n'a pas pu etre supprimer`,
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
    return { id: this.id, path: 'Track' };
  }

  async getDBDiff() {
    const original = await Track.get(this.id, {
      cache: false,
      nullThrowErr: true,
    });
    const changes = DeepDiff.diff(original, this.toJSON());
    return { original, changes };
  }

  toJSON(): ITrack {
    return {
      type: this.type,
      name: this.name,
      releaseDate: this.releaseDate,
      description: this.description,
      cover: this.cover,
      links: this.links,
      artists: this.artists,
      id: this.id,
      isVerified: this.isVerified,
    };
  }

  static async get<J extends boolean = true, E extends boolean = false>(
    id: string,
    options?: MethodOption<J, E>
  ): Promise<Out<J, E>> {
    DevLog(`Récupération de l'track ID: ${id}`, 'debug');
    const {
      json = true,
      cache = true,
      nullThrowErr = false,
      session,
    } = options || {};
    const res = await Track.cache(
      TrackModel.findOne({ id }, null, { session }),
      id,
      session ? false : cache
    );
    DevLog(
      `Track ${res ? 'trouvée' : 'non trouvée'}, ID Track: ${id}`,
      'debug'
    );

    if (res) {
      const track = new Track(res.toObject(), session);
      return (json ? track.toJSON() : track) as Out<J, E>;
    }

    if (nullThrowErr)
      throw new APIError(
        `L'track avec l'identifiant ${id} n'a pas été trouvée`,
        'NOT_FOUND'
      );

    return null as Out<J, E>;
  }

  static async search<J extends boolean = true, E extends boolean = false>(
    filter: ITrackDB,
    options?: MethodOption<J, E>
  ): Promise<Out<J, E, true>> {
    DevLog(`Recherche des tracks...`, 'debug');
    const {
      json = true,
      cache = true,
      nullThrowErr = false,
      session,
    } = options || {};
    const res = await Track.cache(
      TrackModel.find(filter, null, { session }),
      undefined,
      session ? false : cache
    );
    DevLog(`Tracks trouvées: ${res.length}`, 'debug');

    if (res.length > 0) {
      return res.map((result) => {
        const track = new Track(result, session);
        return (json ? track.toJSON() : track) as Out<J, E>;
      }) as Out<J, E, true>;
    }

    if (nullThrowErr)
      throw new APIError(
        `La recherche des tracks avec les filtre ${JSON.stringify(
          filter
        )} n'a pas renvoyé aucun resultat`,
        'NOT_FOUND'
      );

    return null as Out<J, E, true>;
  }

  static async pagination(
    pageFilter?: Partial<ITrackPaginationBody>
  ): Promise<ITrackPaginationResponse> {
    DevLog(`Pagination des tracks...`, 'debug');
    const pagination = new PaginationControllers(TrackModel);

    pagination.useFilter(pageFilter);

    const res = await pagination.getResults();
    res.results = res.results.map((result) => new Track(result).toJSON());

    DevLog(`Tracks trouvées: ${res.resultsCount}`, 'debug');
    return res;
  }
}
