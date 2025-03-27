/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IPatch,
  IPatchDB,
  IMediaRelation,
  ITargetPath,
  IPatchStatus,
  IPatchType,
  IPatchPaginationResponse,
} from '@actunime/types';
import { ClientSession } from 'mongoose';
import { PatchModel, ModelDoc } from '../models';
import { APIError } from '../error';
import { DevLog } from '../logger';
import { mongooseCache } from '../database';
import DeepDiff from 'deep-diff';
import { Output } from '../../_utils/_controllers';
import { ClassUtilSession, MethodOption } from './util';
import { IPatchPaginationBody } from '@actunime/validations';
import { PaginationControllers } from '../../controllers/pagination.controllers';

interface PatchDiff<LHS, RHS = LHS> {
  kind: 'N' | 'D' | 'E' | 'A';
  path: any[];
  rhs: RHS;
  lhs: LHS;
  index: number;
  item: DeepDiff.Diff<LHS, RHS>;
}

type Out<
  J extends boolean,
  E extends boolean,
  A extends boolean = false
> = Output<IPatch, Patch, J, E, A>;

export class Patch extends ClassUtilSession implements IPatch {
  ref?: IMediaRelation | undefined;
  type: IPatchType;
  status: IPatchStatus;
  target: IMediaRelation;
  targetPath: ITargetPath;
  description?: string | undefined;
  reason?: string | undefined;
  changes: any;
  isChangesUpdated?: boolean;
  author: IMediaRelation;
  moderator?: IMediaRelation | undefined;
  id: string;
  original?: IPatch['original'];

  constructor(
    data: Partial<IPatch | IPatchDB | ModelDoc<IPatch>> &
      Required<{ id: string }>,
    session: ClientSession | null = null
  ) {
    super(session);
    this.ref = data?.ref;
    if (!data?.type)
      throw new APIError('Patch constructor type is empty', 'SERVER_ERROR');
    this.type = data?.type;
    if (!data?.status)
      throw new APIError('Patch constructor status is empty', 'SERVER_ERROR');
    this.status = data?.status;
    if (!data?.target)
      throw new APIError('Patch constructor target is empty', 'SERVER_ERROR');
    this.target = data?.target;
    if (!data?.targetPath)
      throw new APIError(
        'Patch constructor targetPath is empty',
        'SERVER_ERROR'
      );
    this.targetPath = data?.targetPath;
    this.description = data?.description;
    this.reason = data?.reason;
    this.changes = data?.changes;
    this.isChangesUpdated = data?.isChangesUpdated;
    if (!data?.author)
      throw new APIError('Patch constructor author is empty', 'SERVER_ERROR');
    this.author = data?.author;
    this.moderator = data?.moderator;
    if (!data?.id)
      throw new APIError('Patch constructor id is empty', 'SERVER_ERROR');
    this.id = data?.id;
    this.original = data?.original;
  }

  Model() {
    return new PatchModel(this.toJSON());
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
          `L'Patch avec l'id ${this.id} n'a pas pu etre sauvegardé`,
          'NOT_FOUND'
        );
      return null as Out<J, E>;
    }
    return (json ? this.toJSON() : this) as Out<J, E>;
  }

  async update<J extends boolean = true, E extends boolean = boolean>(
    options?: Omit<MethodOption<J, E>, 'cache'> & {
      upsert?: boolean;
      set?: Partial<IPatch>;
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
    const update = await Patch.cache(
      PatchModel.findOneAndUpdate(
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
          `L'Patch avec l'id ${this.id} n'a pas pu etre mis à jour`,
          'NOT_FOUND'
        );
      return null as Out<J, E>;
    }

    mongooseCache.clear(this.id);
    const patch = new Patch(update.toObject(), session);
    return (json ? patch.toJSON() : patch) as Out<J, E>;
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
    const deleted = await PatchModel.deleteOne({ id: this.id }, { session });
    if (!deleted.acknowledged || !deleted.deletedCount) {
      if (nullThrowErr)
        throw new APIError(
          `L'Patch avec l'id ${this.id} n'a pas pu etre supprimer`,
          'NOT_FOUND'
        );
      return null as Out<J, E>;
    }
    await mongooseCache.clear(this.id);
    return (json ? this.toJSON() : this) as Out<J, E>;
  }

  public asRelation() {
    return { id: this.id, path: 'Patch' };
  }

  async getDBDiff() {
    const original = await Patch.get(this.id, {
      cache: false,
      nullThrowErr: true,
    });
    const changes = DeepDiff.diff(original, this.toJSON());
    return { original, changes };
  }

  static getChangedFromDiff<T>(originalObject: T, differences: PatchDiff<T>[]) {
    const result = JSON.parse(JSON.stringify(originalObject)); // Cloner l'objet original
    differences.forEach((diff) => {
      DeepDiff.applyChange(result, undefined, diff); // Appliquer chaque changement
    });
    return result as T; // Retourner l'objet modifié
  }

  static restoreChangesFromDiff<T>(modifiedObject: T, differences: PatchDiff<any>[]) {
    const original = JSON.parse(JSON.stringify(modifiedObject)); // Cloner l'objet modifié

    differences.forEach((change) => {
      const { path, kind, lhs, index, item } = change;

      // Naviguer jusqu'à la bonne clé
      let target = original;
      for (let i = 0; i < path.length - 1; i++) {
        target = target[path[i]];
      }
      const key = path[path.length - 1];

      // Appliquer l'inversion
      switch (kind) {
        case 'N': // New (Ajouté) => Supprimer la propriété
          delete target[key];
          break;
        case 'D': // Deleted (Supprimé) => Restaurer l'ancienne valeur
          target[key] = lhs;
          break;
        case 'E': // Edited (Modifié) => Restaurer l'ancienne valeur
          target[key] = lhs;
          break;
        case 'A': // Array modification
          if (item.kind === 'N') {
            target[key].splice(index, 1); // Supprimer l'élément ajouté
          } else if (item.kind === 'D') {
            target[key].splice(index, 0, item.lhs); // Restaurer l'élément supprimé
          } else if (item.kind === 'E') {
            target[key][index] = item.lhs; // Restaurer l'élément modifié
          }
          break;
      }
    });

    return original as T;
  }

  toJSON(): IPatch {
    return {
      ref: this.ref,
      type: this.type,
      status: this.status,
      target: this.target,
      targetPath: this.targetPath,
      description: this.description,
      reason: this.reason,
      changes: this.changes,
      isChangesUpdated: this.isChangesUpdated,
      author: this.author,
      moderator: this.moderator,
      id: this.id,
      original: this.original,
    };
  }

  isPending() {
    return this.status === 'PENDING';
  }

  isAccepted() {
    return this.status === 'ACCEPTED';
  }

  isRejected() {
    return this.status === 'REJECTED';
  }

  isCreate() {
    return this.type === 'CREATE';
  }

  isUpdate() {
    return this.type === 'UPDATE';
  }

  targetIdIs(id: string) {
    return this.target.id === id;
  }

  static async get<J extends boolean = true, E extends boolean = false>(
    filter: string | Partial<IPatchDB>,
    options?: MethodOption<J, E>
  ): Promise<Out<J, E>> {
    const id = typeof filter === 'string' ? filter : filter.id;
    DevLog(`Récupération de l'Patch ID: ${id}`, 'debug');
    const {
      json = true,
      cache = true,
      nullThrowErr = false,
      session,
    } = options || {};
    const res = await Patch.cache(
      PatchModel.findOne(
        typeof filter === 'string' ? { id: filter } : filter,
        null,
        { session }
      ),
      id,
      session ? false : cache
    );
    DevLog(
      `Patch ${res ? 'trouvée' : 'non trouvée'}, ID Patch: ${id}`,
      'debug'
    );

    if (res) {
      const patch = new Patch(res.toObject(), session);
      return (json ? patch.toJSON() : patch) as Out<J, E>;
    }

    if (nullThrowErr)
      throw new APIError(
        `L'Patch avec l'identifiant ${id} n'a pas été trouvée`,
        'NOT_FOUND'
      );

    return null as Out<J, E>;
  }

  static async search<J extends boolean = true, E extends boolean = false>(
    filter: Partial<IPatchDB>,
    options?: MethodOption<J, E>
  ): Promise<Out<J, E, true>> {
    DevLog(`Recherche des Patchs...`, 'debug');
    const {
      json = true,
      cache = true,
      nullThrowErr = false,
      session,
    } = options || {};
    const res = await Patch.cache(
      PatchModel.find(filter, null, { session }),
      undefined,
      session ? false : cache
    );
    DevLog(`Patchs trouvées: ${res.length}`, 'debug');

    if (res.length > 0) {
      return res.map((result) => {
        const patch = new Patch(result, session);
        return (json ? patch.toJSON() : patch) as Out<J, E>;
      }) as Out<J, E, true>;
    }

    if (nullThrowErr)
      throw new APIError(
        `La recherche des Patchs avec les filtre ${JSON.stringify(
          filter
        )} n'a pas renvoyé aucun resultat`,
        'NOT_FOUND'
      );

    return null as Out<J, E, true>;
  }

  static async pagination(
    pageFilter?: Partial<IPatchPaginationBody>
  ): Promise<IPatchPaginationResponse> {
    DevLog(`Pagination des patchs...`, 'debug');
    const pagination = new PaginationControllers(PatchModel);

    pagination.useFilter(pageFilter);

    const res = await pagination.getResults();
    res.results = res.results.map((result) => new Patch(result).toJSON());

    DevLog(`Patchs trouvées: ${res.resultsCount}`, 'debug');
    return res;
  }
}
