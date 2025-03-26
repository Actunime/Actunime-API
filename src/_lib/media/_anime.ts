import {
  IAnime,
  IAnimeDB,
  IAnimeEpisode,
  IAnimeFormat,
  IAnimeRelation,
  ICharacterRelation,
  IMangaRelation,
  IMediaDate,
  IMediaGenres,
  IMediaLink,
  IMediaRelation,
  IMediaSource,
  IMediaStatus,
  IMediaTitle,
  IPersonRelation,
} from '@actunime/types';
import { ClientSession } from 'mongoose';
import { AnimeModel, ModelDoc } from '../models';
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
> = Output<IAnime, Anime, J, E, A>;

export class Anime extends ClassUtilSession implements IAnime {
  public groupe: IMediaRelation;
  public parent?: IAnimeRelation;
  public manga?: IMangaRelation;
  public source?: IMediaSource;
  public title: IMediaTitle;
  public synopsis?: string;
  public date?: IMediaDate;
  public status: IMediaStatus;
  public trailer?: string;
  public format: IAnimeFormat;
  public vf?: boolean;
  public episodes?: IAnimeEpisode;
  public adult?: boolean;
  public explicit?: boolean;
  public cover?: IMediaRelation;
  public banner?: IMediaRelation;
  public genres?: IMediaGenres[];
  public links?: IMediaLink[];
  public companys?: IMediaRelation[];
  public staffs?: IPersonRelation[];
  public characters?: ICharacterRelation[];
  public tracks?: IMediaRelation[];
  public id: string;
  public isVerified: boolean;

  constructor(
    data: Partial<IAnime | IAnimeDB | ModelDoc<IAnime>>,
    session: ClientSession | null = null
  ) {
    super(session);
    if (!data)
      throw new APIError('Anime constructor data is empty', 'SERVER_ERROR');
    if (!data.groupe)
      throw new APIError('Anime constructor groupe is empty', 'SERVER_ERROR');
    this.groupe = data.groupe;
    this.parent = data.parent;
    this.manga = data.manga;
    this.source = data.source;
    if (!data.title)
      throw new APIError('Anime constructor title is empty', 'SERVER_ERROR');
    this.title = data.title;
    this.synopsis = data.synopsis;
    this.date = data.date;
    if (!data.status)
      throw new APIError('Anime constructor status is empty', 'SERVER_ERROR');
    this.status = data.status;
    this.trailer = data.trailer;
    if (!data.format)
      throw new APIError('Anime constructor format is empty', 'SERVER_ERROR');
    this.format = data.format;
    this.vf = data.vf;
    this.episodes = data.episodes;
    this.adult = data.adult;
    this.explicit = data.explicit;
    this.cover = data.cover;
    this.banner = data.banner;
    this.genres = data.genres;
    this.links = data.links;
    this.companys = data.companys;
    this.staffs = data.staffs;
    this.characters = data.characters;
    this.tracks = data.tracks;
    this.id = data.id;
    if (data.isVerified === undefined)
      throw new APIError(
        'Anime constructor isVerified is empty',
        'SERVER_ERROR'
      );
    this.isVerified = data.isVerified;
  }

  Model() {
    return new AnimeModel(this.toJSON());
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
          `L'anime avec l'id ${this.id} n'a pas pu etre sauvegardé`,
          'NOT_FOUND'
        );
      return null as Out<J, E>;
    }
    return (json ? this.toJSON() : this) as Out<J, E>;
  }

  async update<J extends boolean = true, E extends boolean = boolean>(
    options?: Omit<MethodOption<J, E>, 'cache'> & {
      upsert?: boolean;
      set?: Partial<IAnime>;
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
    const update = await Anime.cache(
      AnimeModel.findOneAndUpdate(
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
          `L'anime avec l'id ${this.id} n'a pas pu etre mis à jour`,
          'NOT_FOUND'
        );
      return null as Out<J, E>;
    }

    mongooseCache.clear(this.id);
    const anime = new Anime(update.toObject(), session);
    return (json ? anime.toJSON() : anime) as Out<J, E>;
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
    const deleted = await AnimeModel.deleteOne({ id: this.id }, { session });
    if (!deleted.acknowledged || !deleted.deletedCount) {
      if (nullThrowErr)
        throw new APIError(
          `L'anime avec l'id ${this.id} n'a pas pu etre supprimer`,
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
    return { id: this.id, path: 'Anime' };
  }

  async getDBDiff(original?: IAnime) {
    original = await Anime.get(this.id, {
      cache: false,
      nullThrowErr: true,
    });
    const changes = DeepDiff.diff(original, this.toJSON());
    return { original, changes };
  }

  toJSON(): IAnime {
    return JSON.parse(
      JSON.stringify({
        groupe: this.groupe,
        parent: this.parent,
        manga: this.manga,
        source: this.source,
        title: this.title,
        synopsis: this.synopsis,
        date: this.date,
        status: this.status,
        trailer: this.trailer,
        format: this.format,
        vf: this.vf,
        episodes: this.episodes,
        adult: this.adult,
        explicit: this.explicit,
        cover: this.cover,
        banner: this.banner,
        genres: this.genres,
        links: this.links,
        companys: this.companys,
        staffs: this.staffs,
        characters: this.characters,
        tracks: this.tracks,
        id: this.id,
        isVerified: this.isVerified,
      })
    );
  }

  static async get<J extends boolean = true, E extends boolean = false>(
    id: string,
    options?: MethodOption<J, E>
  ): Promise<Out<J, E>> {
    DevLog(`Récupération de l'anime ID: ${id}`, 'debug');
    const {
      json = true,
      cache = true,
      nullThrowErr = false,
      session,
    } = options || {};
    const res = await Anime.cache(
      AnimeModel.findOne({ id }, null, { session }),
      id,
      session ? false : cache
    );
    DevLog(
      `Anime ${res ? 'trouvée' : 'non trouvée'}, ID Anime: ${id}`,
      'debug'
    );

    if (res) {
      const anime = new Anime(res.toObject(), session);
      return (json ? anime.toJSON() : anime) as Out<J, E>;
    }

    if (nullThrowErr)
      throw new APIError(
        `L'anime avec l'identifiant ${id} n'a pas été trouvée`,
        'NOT_FOUND'
      );

    return null as Out<J, E>;
  }

  static async search<J extends boolean = true, E extends boolean = false>(
    filter: IAnimeDB,
    options?: MethodOption<J, E>
  ): Promise<Out<J, E, true>> {
    DevLog(`Recherche des animes...`, 'debug');
    const {
      json = true,
      cache = true,
      nullThrowErr = false,
      session,
    } = options || {};
    const res = await Anime.cache(
      AnimeModel.find(filter, null, { session }),
      undefined,
      session ? false : cache
    );
    DevLog(`Animes trouvées: ${res.length}`, 'debug');

    if (res.length > 0) {
      return res.map((result) => {
        const anime = new Anime(result, session);
        return (json ? anime.toJSON() : anime) as Out<J, E>;
      }) as Out<J, E, true>;
    }

    if (nullThrowErr)
      throw new APIError(
        `La recherche des animes avec les filtre ${JSON.stringify(
          filter
        )} n'a pas renvoyé aucun resultat`,
        'NOT_FOUND'
      );

    return null as Out<J, E, true>;
  }
}
