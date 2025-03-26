import {
  IManga,
  IMangaDB,
  IMangaChapterVolums,
  IMangaFormat,
  IMangaRelation,
  ICharacterRelation,
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
import { MangaModel, ModelDoc } from '../models';
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
> = Output<IManga, Manga, J, E, A>;

export class Manga extends ClassUtilSession implements IManga {
  groupe: IMediaRelation;
  parent?: IMangaRelation;
  title: IMediaTitle;
  date?: IMediaDate;
  synopsis?: string;
  source?: IMediaSource;
  trailer?: string;
  format?: IMangaFormat;
  vf?: boolean;
  genres?: IMediaGenres[];
  status?: IMediaStatus;
  chapters?: IMangaChapterVolums;
  volumes?: IMangaChapterVolums;
  adult?: boolean;
  explicit?: boolean;
  links?: IMediaLink[];
  cover?: IMediaRelation;
  banner?: IMediaRelation;
  companys?: IMediaRelation[];
  staffs?: IPersonRelation[];
  characters?: ICharacterRelation[];
  id: string;
  isVerified: boolean;

  constructor(
    data: Partial<IManga | IMangaDB | ModelDoc<IManga>>,
    session: ClientSession | null = null
  ) {
    super(session);
    if (!data)
      throw new APIError('Manga constructor data is empty', 'SERVER_ERROR');
    if (!data.groupe)
      throw new APIError('Manga constructor groupe is empty', 'SERVER_ERROR');
    this.groupe = data.groupe;
    this.parent = data.parent;
    this.source = data.source;
    if (!data.title)
      throw new APIError('Manga constructor title is empty', 'SERVER_ERROR');
    this.title = data.title;
    this.synopsis = data.synopsis;
    this.date = data.date;
    if (!data.status)
      throw new APIError('Manga constructor status is empty', 'SERVER_ERROR');
    this.status = data.status;
    this.trailer = data.trailer;
    if (!data.format)
      throw new APIError('Manga constructor format is empty', 'SERVER_ERROR');
    this.format = data.format;
    this.vf = data.vf;
    this.chapters = data.chapters;
    this.volumes = data.volumes;
    this.adult = data.adult;
    this.explicit = data.explicit;
    this.cover = data.cover;
    this.banner = data.banner;
    this.genres = data.genres;
    this.links = data.links;
    this.companys = data.companys;
    this.staffs = data.staffs;
    this.characters = data.characters;
    this.id = data.id;
    if (data.isVerified === undefined)
      throw new APIError(
        'Manga constructor isVerified is empty',
        'SERVER_ERROR'
      );
    this.isVerified = data.isVerified;
  }

  Model() {
    return new MangaModel(this.toJSON());
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
          `L'manga avec l'id ${this.id} n'a pas pu etre sauvegardé`,
          'NOT_FOUND'
        );
      return null as Out<J, E>;
    }
    return (json ? this.toJSON() : this) as Out<J, E>;
  }

  async update<J extends boolean = true, E extends boolean = boolean>(
    options?: Omit<MethodOption<J, E>, 'cache'> & {
      upsert?: boolean;
      set?: Partial<IManga>;
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
    const update = await Manga.cache(
      MangaModel.findOneAndUpdate(
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
          `L'manga avec l'id ${this.id} n'a pas pu etre mis à jour`,
          'NOT_FOUND'
        );
      return null as Out<J, E>;
    }

    mongooseCache.clear(this.id);
    const manga = new Manga(update.toObject(), session);
    return (json ? manga.toJSON() : manga) as Out<J, E>;
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
    const deleted = await MangaModel.deleteOne({ id: this.id }, { session });
    if (!deleted.acknowledged || !deleted.deletedCount) {
      if (nullThrowErr)
        throw new APIError(
          `L'manga avec l'id ${this.id} n'a pas pu etre supprimer`,
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
    return { id: this.id, path: 'Manga' };
  }

  async getDBDiff() {
    const original = await Manga.get(this.id, {
      cache: false,
      nullThrowErr: true,
    });
    const changes = DeepDiff.diff(original, this.toJSON());
    return { original, changes };
  }

  toJSON(): IManga {
    return {
      groupe: this.groupe,
      parent: this.parent,
      source: this.source,
      title: this.title,
      synopsis: this.synopsis,
      date: this.date,
      status: this.status,
      trailer: this.trailer,
      format: this.format,
      vf: this.vf,
      chapters: this.chapters,
      volumes: this.volumes,
      adult: this.adult,
      explicit: this.explicit,
      cover: this.cover,
      banner: this.banner,
      genres: this.genres,
      links: this.links,
      companys: this.companys,
      staffs: this.staffs,
      characters: this.characters,
      id: this.id,
      isVerified: this.isVerified,
    };
  }

  static async get<J extends boolean = true, E extends boolean = false>(
    id: string,
    options?: MethodOption<J, E>
  ): Promise<Out<J, E>> {
    DevLog(`Récupération de l'manga ID: ${id}`, 'debug');
    const {
      json = true,
      cache = true,
      nullThrowErr = false,
      session,
    } = options || {};
    const res = await Manga.cache(
      MangaModel.findOne({ id }, null, { session }),
      id,
      session ? false : cache
    );
    DevLog(
      `Manga ${res ? 'trouvée' : 'non trouvée'}, ID Manga: ${id}`,
      'debug'
    );

    if (res) {
      const manga = new Manga(res.toObject(), session);
      return (json ? manga.toJSON() : manga) as Out<J, E>;
    }

    if (nullThrowErr)
      throw new APIError(
        `L'manga avec l'identifiant ${id} n'a pas été trouvée`,
        'NOT_FOUND'
      );

    return null as Out<J, E>;
  }

  static async search<J extends boolean = true, E extends boolean = false>(
    filter: IMangaDB,
    options?: MethodOption<J, E>
  ): Promise<Out<J, E, true>> {
    DevLog(`Recherche des mangas...`, 'debug');
    const {
      json = true,
      cache = true,
      nullThrowErr = false,
      session,
    } = options || {};
    const res = await Manga.cache(
      MangaModel.find(filter, null, { session }),
      undefined,
      session ? false : cache
    );
    DevLog(`Mangas trouvées: ${res.length}`, 'debug');

    if (res.length > 0) {
      return res.map((result) => {
        const manga = new Manga(result, session);
        return (json ? manga.toJSON() : manga) as Out<J, E>;
      }) as Out<J, E, true>;
    }

    if (nullThrowErr)
      throw new APIError(
        `La recherche des mangas avec les filtre ${JSON.stringify(
          filter
        )} n'a pas renvoyé aucun resultat`,
        'NOT_FOUND'
      );

    return null as Out<J, E, true>;
  }
}
