import { ClientSession } from 'mongoose';
import {
  CheckPermissions,
  IPatch,
  IPatchStatus,
  ITargetPath,
  IUser,
  PermissionsArray,
} from '@actunime/types';
import LogSession from '../_utils/_logSession';
import { UtilControllers } from '../_utils/_controllers';
import { DevLog } from '../_lib/logger';
import { PatchModel } from '../_lib/models';
import { Patch } from '../_lib/media';
import { APIError } from '../_lib/error';

class PatchController extends UtilControllers.withBasic {
  private targetPath: ITargetPath = 'Patch';
  private user: IUser;
  constructor(
    session: ClientSession,
    options: { log?: LogSession; user: IUser }
  ) {
    super(session, options);
    this.user = options.user;
  }

  async getPatchFrom(
    targetPath: ITargetPath,
    targetID: string,
    status?: IPatchStatus
  ) {
    DevLog(
      `Récupération de la mise a jour de ${targetPath} ID: ${targetID}`,
      'debug'
    );
    let promise = PatchModel.findOne({
      targetPath,
      'target.id': targetID,
      ...(status ? { status } : {}),
    });
    if (this.session) promise = promise.session(this.session);
    else promise.cache('60m');
    const res = await promise;
    DevLog(
      `Mise a jour ${
        res ? `trouvée, ID Mise a jour: ${res.id}` : 'non trouvée'
      }`,
      'debug'
    );
    return res;
  }

  async fitlerPatchFrom(
    targetPath: ITargetPath,
    targetID: string,
    status?: IPatchStatus
  ) {
    DevLog(
      `Filtrage des mise a jour de ${targetPath} ID: ${targetID}`,
      'debug'
    );
    let promise = PatchModel.find({
      targetPath,
      'target.id': targetID,
      ...(status ? { status } : {}),
    });
    if (this.session) promise = promise.session(this.session);
    else promise.cache('60m');
    const res = await promise;
    DevLog(`Mise a jour trouvées: ${res.length}`, 'debug');
    return res;
  }

  async getPatchReferences(id: string) {
    DevLog(`Récupération des references de la mise a jour ID: ${id}`, 'debug');
    const res = await PatchModel.find({ ref: { id } }).cache('60m');
    DevLog(`Mise a jour trouvées: ${res.length}`, 'debug');
    return res;
  }

  async create(data: Partial<IPatch> & { id: string }) {
    DevLog(
      `Création d'une mise a jour... | ${data.targetPath} (${data.target?.id})`,
      'debug'
    );
    const res = new Patch(data, this.session);
    await res.save({ nullThrowErr: true });
    DevLog(
      `Mise a jour créee, ID Mise a jour: ${res.id} | ${data.targetPath} (${data.target?.id})`,
      'debug'
    );
    return res.toJSON();
  }

  public async delete(
    patchID: string
    // params: IMediaDeleteBody
  ) {
    DevLog("Suppression d'une demande de modification d'un anime...", 'debug');

    const request = await Patch.get(patchID, {
      nullThrowErr: true,
      json: false,
      session: this.session,
    });

    const perm = PermissionsArray.find(
      (perm) => perm === `${request.targetPath.toUpperCase()}_REQUEST_DELETE`
    );

    if (!perm)
      throw new APIError(
        `La requête n'est pas supprimable du a son type ${request.targetPath} qui n'a pas de permission de suppression`,
        'FORBIDDEN'
      );

    if (!CheckPermissions([perm], this.user.permissions)) {
      throw new APIError(
        `Vous n'avez pas la permission de supprimer cette demande`,
        'UNAUTHORIZED'
      );
    }

    if (request.isPending())
      throw new APIError(
        'Vous ne pouvez pas supprimer une demande en attente, refusez-la dabord',
        'FORBIDDEN'
      );

    const deleted = await request.delete({ nullThrowErr: true });

    DevLog(
      `Demande supprimée (${deleted}), ID Anime: ${request.target.id}, ID Demande: ${request.id}`,
      'debug'
    );

    return {
      patch: request.toJSON(),
    };
  }
}
export { PatchController };
