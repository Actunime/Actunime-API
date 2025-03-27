/* eslint-disable @typescript-eslint/no-explicit-any */
import { ClientSession } from 'mongoose';
import {
  IPatch,
  IPatchStatus,
  ITargetPath,
  IUser,
} from '@actunime/types';
import LogSession from '../_utils/_logSession';
import DeepDiff from 'deep-diff';
import { UtilControllers } from '../_utils/_controllers';
import { DevLog } from '../_lib/logger';
import { PatchModel } from '../_lib/models';
import { Patch } from '../_lib/media';

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

  async create(data: Partial<IPatch>) {
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

  // async acceptPatchReferences(id: string, params: { reccursive: boolean }) {
  //   const findPatchReferences = await this.getPatchReferences(id);
  //   if (findPatchReferences.length > 0) {
  //     const groupeController = new GroupeController(this.session, {
  //       log: this.log,
  //       user: this.user,
  //     });
  //     const imageController = new ImageController(this.session, {
  //       log: this.log,
  //       user: this.user,
  //     });
  //     const mangaController = new MangaController(this.session, {
  //       log: this.log,
  //       user: this.user,
  //     });
  //     const companyController = new CompanyController(this.session, {
  //       log: this.log,
  //       user: this.user,
  //     });
  //     const personController = new PersonController(this.session, {
  //       log: this.log,
  //       user: this.user,
  //     });
  //     const patchController = new PatchController(this.session, {
  //       log: this.log,
  //       user: this.user,
  //     });
  //     const trackController = new TrackController(this.session, {
  //       log: this.log,
  //       user: this.user,
  //     });
  //     await Promise.all(
  //       findPatchReferences.map(async (ref) => {
  //         switch (
  //           ref.targetPath
  //           // case "Anime":
  //           //     await this.animeController.request_accept(ref.id, params);
  //           //     break;
  //           // case "Manga":
  //           //     await this.mangaController.request_accept(ref.id, params);
  //           //     break;
  //           // case "Groupe":
  //           //     await this.groupeController.request_accept(ref.id, params);
  //           //     break;
  //           // case "Image":
  //           //     await this.imageController.request_accept(ref.id, params);
  //           //     break;
  //           // case "Patch":
  //           //     await this.patchController.request_accept(ref.id, params);
  //           //     break;
  //           // case "Person":
  //           //     await this.personController.request_accept(ref.id, params);
  //           //     break;
  //           // case "Company":
  //           //     await this.companyController.request_accept(ref.id, params);
  //           //     break;
  //           // case "Track":
  //           //     await this.trackController.request_accept(ref.id, params);
  //           //     break;
  //         ) {
  //         }
  //       })
  //     );
  //   }
  // }

  restoreOriginalFromDifferences(
    modifiedObject: any,
    differences: PatchDiff<any>[]
  ) {
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

    return original;
  }

  getModifiedFromDifferences<T>(
    originalObject: any,
    differences: PatchDiff<T>[]
  ) {
    const result = JSON.parse(JSON.stringify(originalObject)); // Cloner l'objet original
    differences.forEach((diff) => {
      DeepDiff.applyChange(result, undefined, diff); // Appliquer chaque changement
    });
    return result as T; // Retourner l'objet modifié
  }
}

export interface PatchDiff<LHS, RHS = LHS> {
  kind: 'N' | 'D' | 'E' | 'A';
  path: any[];
  rhs: RHS;
  lhs: LHS;
  index: number;
  item: DeepDiff.Diff<LHS, RHS>;
}
export { PatchController };
