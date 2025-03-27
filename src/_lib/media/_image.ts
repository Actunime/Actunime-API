import { IImageLabel, IImagePaginationResponse, ITargetPath } from '@actunime/types';

import { IImage, IImageDB, IMediaRelation } from '@actunime/types';
import { ClientSession } from 'mongoose';
import { ImageModel, ModelDoc } from '../models';
import { APIError } from '../error';
import { DevLog } from '../logger';
import { Output } from '../../_utils/_controllers';
import { mongooseCache } from '../database';
import DeepDiff from 'deep-diff';
import { ClassUtilSession, MethodOption } from './util';
import { IImagePaginationBody } from '@actunime/validations';
import { PaginationControllers } from '../../controllers/pagination.controllers';

type Out<
  J extends boolean,
  E extends boolean,
  A extends boolean = false
> = Output<IImage, Image, J, E, A>;

export class Image extends ClassUtilSession implements IImage {
  public label: IImageLabel;
  public target: IMediaRelation;
  public targetPath: ITargetPath;
  public id: string;
  public isVerified: boolean;

  constructor(
    data: Partial<IImage | IImageDB | ModelDoc<IImage>>,
    session: ClientSession | null = null
  ) {
    super(session);
    if (!data)
      throw new APIError('Image constructor data is empty', 'SERVER_ERROR');
    if (!data.label)
      throw new APIError('Image constructor label is empty', 'SERVER_ERROR');
    this.label = data.label;
    if (!data.target)
      throw new APIError('Image constructor target is empty', 'SERVER_ERROR');
    this.target = data.target;
    if (!data.targetPath)
      throw new APIError(
        'Image constructor targetPath is empty',
        'SERVER_ERROR'
      );
    this.targetPath = data.targetPath;
    this.id = data.id;
    if (data.isVerified === undefined)
      throw new APIError(
        'Image constructor isVerified is empty',
        'SERVER_ERROR'
      );
    this.isVerified = data.isVerified;
  }

  Model() {
    return new ImageModel(this.toJSON());
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
          `L'image avec l'id ${this.id} n'a pas pu etre sauvegardé`,
          'NOT_FOUND'
        );
      return null as Out<J, E>;
    }
    return (json ? this.toJSON() : this) as Out<J, E>;
  }

  async update<J extends boolean = true, E extends boolean = boolean>(
    options?: Omit<MethodOption<J, E>, 'cache'> & {
      upsert?: boolean;
      set?: Partial<IImage>;
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
    const update = await Image.cache(
      ImageModel.findOneAndUpdate(
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
          `L'image avec l'id ${this.id} n'a pas pu etre mis à jour`,
          'NOT_FOUND'
        );
      return null as Out<J, E>;
    }

    mongooseCache.clear(this.id);
    const image = new Image(update.toObject(), session);
    return (json ? image.toJSON() : image) as Out<J, E>;
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
    const deleted = await ImageModel.deleteOne({ id: this.id }, { session });
    if (!deleted.acknowledged || !deleted.deletedCount) {
      if (nullThrowErr)
        throw new APIError(
          `L'image avec l'id ${this.id} n'a pas pu etre supprimer`,
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
    return { id: this.id, path: 'Image' };
  }

  async getDBDiff() {
    const original = await Image.get(this.id, {
      cache: false,
      nullThrowErr: true,
    });
    const changes = DeepDiff.diff(original, this.toJSON());
    return { original, changes };
  }

  toJSON(): IImage {
    return {
      label: this.label,
      target: this.target,
      targetPath: this.targetPath,
      id: this.id,
      isVerified: this.isVerified,
    };
  }

  static async get<J extends boolean = true, E extends boolean = false>(
    id: string,
    options?: MethodOption<J, E>
  ): Promise<Out<J, E>> {
    DevLog(`Récupération de l'image ID: ${id}`, 'debug');
    const {
      json = true,
      cache = true,
      nullThrowErr = false,
      session,
    } = options || {};
    const res = await Image.cache(
      ImageModel.findOne({ id }, null, { session }),
      id,
      session ? false : cache
    );
    DevLog(
      `Image ${res ? 'trouvée' : 'non trouvée'}, ID Image: ${id}`,
      'debug'
    );

    if (res) {
      const image = new Image(res.toObject(), session);
      return (json ? image.toJSON() : image) as Out<J, E>;
    }

    if (nullThrowErr)
      throw new APIError(
        `L'image avec l'identifiant ${id} n'a pas été trouvée`,
        'NOT_FOUND'
      );

    return null as Out<J, E>;
  }

  static async search<J extends boolean = true, E extends boolean = false>(
    filter: IImageDB,
    options?: MethodOption<J, E>
  ): Promise<Out<J, E, true>> {
    DevLog(`Recherche des images...`, 'debug');
    const {
      json = true,
      cache = true,
      nullThrowErr = false,
      session,
    } = options || {};
    const res = await Image.cache(
      ImageModel.find(filter, null, { session }),
      undefined,
      session ? false : cache
    );
    DevLog(`Images trouvées: ${res.length}`, 'debug');

    if (res.length > 0) {
      return res.map((result) => {
        const image = new Image(result, session);
        return (json ? image.toJSON() : image) as Out<J, E>;
      }) as Out<J, E, true>;
    }

    if (nullThrowErr)
      throw new APIError(
        `La recherche des images avec les filtre ${JSON.stringify(
          filter
        )} n'a pas renvoyé aucun resultat`,
        'NOT_FOUND'
      );

    return null as Out<J, E, true>;
  }

  static async createFileCDN(data: {
    id: string;
    path: ITargetPath;
    value: string;
    valueIsUrl: boolean;
  }) {
    const req = await fetch(
      'http://' +
        (process.env.IMAGE_LOCAL_HOST || 'localhost') +
        ':' +
        (process.env.IMAGE_PORT || '3006') +
        '/v1/create',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    if (req.status !== 200) throw new Error("Impossible de créer l'image");
  }

  static async deleteFileCDN(data: { id: string; path: ITargetPath }) {
    const req = await fetch(
      'http://' +
        process.env.IMAGE_LOCAL_HOST +
        ':' +
        process.env.IMAGE_PORT +
        '/v1/delete',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    if (req.status !== 200) throw new Error("Impossible de supprimer l'image");
  }

  static async pagination(
    pageFilter?: Partial<IImagePaginationBody>
  ): Promise<IImagePaginationResponse> {
    DevLog(`Pagination des images...`, 'debug');
    const pagination = new PaginationControllers(ImageModel);

    pagination.useFilter(pageFilter);

    const res = await pagination.getResults();
    res.results = res.results.map((result) => new Image(result).toJSON());

    DevLog(`Images trouvées: ${res.resultsCount}`, 'debug');
    return res;
  }
}
