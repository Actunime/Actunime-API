import { ClientSession } from 'mongoose';
import { APIError } from '../_lib/error';
import {
  IGroupe,
  ITargetPath,
  IUser,
} from '@actunime/types';
import {
  IGroupeAddBody,
  IGroupeBody,
  IGroupeCreateBody,
  IMediaDeleteBody,
} from '@actunime/validations';
import { UtilControllers } from '../_utils/_controllers';
import LogSession from '../_utils/_logSession';
import { DevLog } from '../_lib/logger';
import { genPublicID } from '@actunime/utils';
import { Patch } from '../_lib/media';
import { Groupe } from '../_lib/media/_groupe';

class GroupeController extends UtilControllers.withBasic {
  private targetPath: ITargetPath = 'Groupe';
  private user: IUser;
  constructor(
    session: ClientSession,
    options: { log?: LogSession; user: IUser }
  ) {
    super(session, options);
    this.user = options.user;
  }

  async build(
    input: IGroupeBody,
    params?: { groupeId?: string; refId?: string; isRequest?: boolean }
  ) {
    const groupe: Partial<IGroupe> = {
      ...input,
      isVerified: false,
      id: params?.groupeId || genPublicID(8),
    };
    const session = this.session;
    this.needSession(session);
    if (params?.groupeId) {
      // Vérification que l'anime existe;
      const get = await Groupe.get(params.groupeId, {
        cache: '5s',
        nullThrowErr: true,
        session,
      });
      // Valeur a synchroniser;
      groupe.isVerified = get.isVerified;
    }
    DevLog(`Build Groupe...`);
    return new Groupe(groupe, this.session);
  }

  public async add(
    item: IGroupeAddBody | undefined,
    refId: string,
    isRequest: boolean
  ) {
    const session = this.session;
    if (item?.id) {
      const get = await Groupe.get(item.id, {
        nullThrowErr: true,
        session,
      });
      return { id: get.id };
    } else if (item?.newGroupe) {
      if (isRequest) {
        const { data, patch } = await this.create_request(item.newGroupe!, {
          refId,
        });
        return { id: data.id, patch };
      } else {
        const { data, patch } = await this.create(item.newGroupe!, {
          refId,
        });
        return { id: data.id, patch };
      }
    } else if (item)
      throw new APIError('Vous devez fournir un groupe valide', 'BAD_REQUEST');
    return;
  }

  public async bulkAdd(
    groupes: IGroupeAddBody[] | undefined,
    refId: string,
    isRequest: boolean
  ) {
    if (!groupes?.length) return undefined;
    const items = await Promise.all(
      groupes.map(async (groupe) => this.add(groupe, refId, isRequest))
    );
    return {
      items: items.filter((data) => data?.id).map((data) => ({ id: data!.id })),
      patchs: items.filter((data) => data?.patch).map((data) => data!.patch!),
    };
  }

  public async create(
    data: IGroupeCreateBody['data'],
    params: Omit<IGroupeCreateBody, 'data'> & { refId?: string }
  ) {
    DevLog("Création de l'groupe...", 'debug');
    this.needSession(this.session);
    const patchID = genPublicID(8);
    const build = await this.build(data, { refId: patchID, isRequest: false });
    build.setVerified();

    const newPatch = new Patch(
      {
        ...(params.refId && { ref: { id: params.refId } }),
        id: patchID,
        type: 'CREATE',
        author: { id: this.user.id },
        target: build.asRelation(),
        targetPath: this.targetPath,
        original: build.toJSON(),
        status: 'ACCEPTED',
        description: params.description,
        moderator: { id: this.user.id },
      },
      this.session
    );

    await newPatch.save({ nullThrowErr: true });

    this.log?.add("Création d'un groupe", [
      { name: 'Nom', content: build.name.default },
      { name: 'ID', content: build.id },
      { name: 'MajID', content: patchID },
      { name: 'Description', content: params.description },
      {
        name: 'Modérateur',
        content: `${this.user.username} (${this.user.id})`,
      },
    ]);

    const saved = await build.save({ nullThrowErr: true });

    DevLog(
      `Groupe créé... ID Groupe: ${saved.id}, ID Maj: ${patchID}`,
      'debug'
    );
    return {
      data: saved,
      patch: newPatch.toJSON(),
    };
  }

  public async update(
    id: string,
    data: IGroupeCreateBody['data'],
    params: Omit<IGroupeCreateBody, 'data'> & { refId?: string }
  ) {
    DevLog("Mise à jour de l'groupe...", 'debug');
    this.needSession(this.session);
    const patchID = genPublicID(8);
    const build = await this.build(data, {
      refId: patchID,
      isRequest: false,
      groupeId: id,
    });
    const { original, changes } = await build.getDBDiff();

    console.log('changements', changes);

    if (!changes || (changes && !changes.length))
      throw new APIError("Aucun changement n'a été détecté !", 'EMPTY_CHANGES');

    const newPatch = new Patch(
      {
        ...(params.refId && { ref: { id: params.refId } }),
        id: patchID,
        type: 'UPDATE',
        author: { id: this.user.id },
        target: build.asRelation(),
        targetPath: this.targetPath,
        original,
        changes,
        status: 'ACCEPTED',
        description: params.description,
        moderator: { id: this.user.id },
      },
      this.session
    );

    await newPatch.save({ nullThrowErr: true });

    this.log?.add("Modification d'un groupe", [
      { name: 'Nom', content: build.name.default },
      { name: 'ID', content: build.id },
      { name: 'MajID', content: patchID },
      { name: 'Description', content: params.description },
      {
        name: 'Modérateur',
        content: `${this.user.username} (${this.user.id})`,
      },
    ]);

    const updated = await build.update({ nullThrowErr: true });

    DevLog(
      `Groupe mis à jour, ID Groupe: ${build.id}, ID Maj: ${patchID}`,
      'debug'
    );

    return {
      data: updated,
      patch: newPatch.toJSON(),
    };
  }

  public async delete(id: string, params: IMediaDeleteBody) {
    DevLog("Suppression de l'groupe...", 'debug');
    this.needSession(this.session);
    const media = await Groupe.get(id, {
      json: false,
      nullThrowErr: true,
      session: this.session,
    });
    const deleted = await media.delete({ nullThrowErr: true });
    const patchID = genPublicID(8);

    if (media.isVerified) {
      // Créez un patch que si l'groupe était un groupe vérifié;
      const newPatch = new Patch(
        {
          id: patchID,
          type: 'DELETE',
          author: { id: this.user.id },
          target: media.asRelation(),
          targetPath: this.targetPath,
          original: media.toJSON(),
          status: 'ACCEPTED',
          reason: params.reason,
          moderator: { id: this.user.id },
        },
        this.session
      );

      await newPatch.save({ nullThrowErr: true });

      this.log?.add("Suppresion d'un groupe", [
        { name: 'Nom', content: media.name.default },
        { name: 'ID', content: media.id },
        { name: 'Raison', content: params.reason },
        {
          name: 'Modérateur',
          content: `${this.user.username} (${this.user.id})`,
        },
      ]);

      DevLog(
        `Groupe supprimé, ID Groupe: ${media.id}, ID Maj: ${patchID}`,
        'debug'
      );

      return {
        data: deleted,
        patch: newPatch.toJSON(),
      };
    }

    DevLog(
      `Groupe non supprimé ou inexistant ou bug ???, ID Groupe: ${media.id}`,
      'debug'
    );
    return {
      data: deleted,
    };
  }

  public async verify(id: string) {
    DevLog("Verification de l'groupe...", 'debug');
    const media = await Groupe.get(id, {
      json: false,
      nullThrowErr: true,
      session: this.session,
    });
    await media.setVerified(true);
    DevLog(`Groupe verifié, ID Groupe: ${media.id}`, 'debug');
    return media.toJSON();
  }

  public async unverify(id: string) {
    DevLog("Verification de l'groupe...", 'debug');
    const media = await Groupe.get(id, {
      json: false,
      nullThrowErr: true,
      session: this.session,
    });
    await media.setUnverified(true);
    DevLog(`Groupe non verifié, ID Groupe: ${media.id}`, 'debug');
    return media.toJSON();
  }

  public async create_request(
    data: IGroupeCreateBody['data'],
    params: Omit<IGroupeCreateBody, 'data'> & { refId?: string }
  ) {
    DevLog("Demande de création d'un groupe...", 'debug');
    const patchID = genPublicID(8);
    const build = await this.build(data, { refId: patchID, isRequest: true });
    build.setUnverified();

    const newPatch = new Patch(
      {
        ...(params.refId && { ref: { id: params.refId } }),
        id: patchID,
        type: 'CREATE',
        author: { id: this.user.id },
        target: build.asRelation(),
        targetPath: this.targetPath,
        original: build.toJSON(),
        status: 'PENDING',
        description: params.description,
      },
      this.session
    );

    await newPatch.save({ nullThrowErr: true });
    await build.save({ nullThrowErr: true });

    this.log?.add("Demande de création d'un groupe", [
      { name: 'Nom', content: build.name.default },
      { name: 'ID', content: build.id },
      { name: 'MajID', content: patchID },
      { name: 'Description', content: params.description },
      {
        name: 'Modérateur',
        content: `${this.user.username} (${this.user.id})`,
      },
    ]);

    DevLog(
      `Groupe créé, Demande crée... ID Groupe: ${build.id}, ID Demande: ${patchID}`,
      'debug'
    );

    return {
      data: build.toJSON(),
      patch: newPatch.toJSON(),
    };
  }

  public async update_request(
    id: string,
    data: IGroupeCreateBody['data'],
    params: Omit<IGroupeCreateBody, 'data'> & { refId?: string }
  ) {
    DevLog("Demande de modification d'un groupe...", 'debug');
    const patchID = genPublicID(8);
    const build = await this.build(data, {
      refId: patchID,
      isRequest: true,
      groupeId: id,
    });
    const { changes } = await build.getDBDiff();
    console.log('changements', changes);

    if (!changes || (changes && !changes.length))
      throw new APIError("Aucun changement n'a été détecté !", 'EMPTY_CHANGES');

    const newPatch = new Patch(
      {
        ...(params.refId && { ref: { id: params.refId } }),
        id: patchID,
        type: 'UPDATE',
        author: { id: this.user.id },
        target: build.asRelation(),
        targetPath: this.targetPath,
        changes,
        status: 'PENDING',
        description: params.description,
      },
      this.session
    );

    await newPatch.save({ nullThrowErr: true });

    this.log?.add("Demande de modification d'un groupe", [
      { name: 'Nom', content: build.name.default },
      { name: 'ID', content: build.id },
      { name: 'MajID', content: patchID },
      { name: 'Description', content: params.description },
      {
        name: 'Modérateur',
        content: `${this.user.username} (${this.user.id})`,
      },
    ]);

    DevLog(
      `Demande crée, ID Groupe: ${build.id}, ID Demande: ${patchID}`,
      'debug'
    );

    return {
      data: build.toJSON(),
      patch: newPatch.toJSON(),
    };
  }

  public async update_patch(
    groupeID: string,
    patchID: string,
    data: IGroupeCreateBody['data'],
    params: Omit<IGroupeCreateBody, 'data'>
  ) {
    DevLog(
      "Modification d'une demande de modification d'un groupe...",
      'debug'
    );
    const request = await Patch.get(patchID, {
      nullThrowErr: true,
      json: false,
      session: this.session,
    });
    if (!request.isPending())
      throw new APIError(
        'Vous pouvez modifier que les demandes en attente',
        'BAD_REQUEST'
      );

    if (!request.targetIdIs(groupeID))
      throw new APIError(
        "L'identifiant de l'groupe n'est pas celui qui est lié a la requête",
        'BAD_REQUEST'
      );

    const newPatchData = await this.build(data, { groupeId: groupeID });

    const { changes } = await newPatchData.getDBDiff();
    if (!changes)
      throw new APIError("Aucun changement n'a été détecté !", 'EMPTY_CHANGES');

    // Création du PATCH de modification pour un suivi en status ACCEPTED pour un suivi;
    const newPatch = new Patch(
      {
        type: 'UPDATE',
        author: { id: this.user.id },
        moderator: { id: this.user.id },
        target: request.asRelation(),
        targetPath: 'Patch',
        original: request.changes, // Spécial
        changes,
        status: 'ACCEPTED',
        description: params.description,
      },
      this.session
    );

    await newPatch.save({ nullThrowErr: true });

    const newRequest = await request.update({
      set: { changes, isChangesUpdated: true },
      nullThrowErr: true,
    });

    DevLog(
      `Demande modifiée, ID Groupe: ${groupeID}, ID Demande: ${newRequest.id}`,
      'debug'
    );

    return {
      data: newPatchData.toJSON(),
      patch: newPatch.toJSON(),
    };
  }

  public async delete_patch(
    groupeID: string,
    patchID: string
    // params: IMediaDeleteBody
  ) {
    DevLog("Suppression d'une demande de modification d'un groupe...", 'debug');
    const request = await Patch.get(patchID, {
      nullThrowErr: true,
      json: false,
      session: this.session,
    });

    if (!request.targetIdIs(groupeID))
      throw new APIError(
        "L'identifiant de l'groupe n'est pas celui qui est lié a la requête",
        'BAD_REQUEST'
      );

    const deleted = await request.delete({ nullThrowErr: true });

    // Gérer le reccursive
    // if (params.deleteTarget)
    //     await this.delete(request.target.id, params, ["GROUPE_REQUEST_DELETE"]);

    DevLog(
      `Demande supprimée (${deleted}), ID Groupe: ${request.target.id}, ID Demande: ${request.id}`,
      'debug'
    );

    return {
      patch: request.toJSON(),
    };
  }

  public async accept_patch(
    groupeID: string,
    patchID: string
    // params: IMediaVerifyBody
  ) {
    DevLog("Acceptation d'une demande de modification d'un groupe...", 'debug');
    const patch = await Patch.get(patchID, {
      nullThrowErr: true,
      json: false,
    });

    if (!patch.targetIdIs(groupeID))
      throw new APIError(
        "L'identifiant de l'groupe n'est pas celui qui est lié a la requête",
        'BAD_REQUEST'
      );

    if (!patch.isPending())
      throw new APIError(
        'Vous ne pouvez pas accepter cette requête',
        'FORBIDDEN'
      );

    if (!patch.isCreate() && !patch.isUpdate())
      throw new APIError(
        'Vous ne pouvez pas accepter cette requête',
        'FORBIDDEN'
      );

    const target = await Groupe.get(patch.target.id, {
      nullThrowErr: true,
      json: false,
      session: this.session,
    });

    let newData: IGroupe;
    if (patch.isCreate()) {
      if (patch.changes) {
        DevLog(
          `Le patch contient des changements qui vont être appliqués`,
          'debug'
        );
        newData = patch.getChangedFromDiff(target.toJSON(), patch.changes);
        await target.update({ set: newData });
      } else {
        DevLog(`Le patch ne contient aucun changement |...`, 'debug');
        newData = target.toJSON();
      }
    } else {
      if (patch.changes && patch.isUpdate()) {
        DevLog(
          `Le patch contient des changements qui vont être appliqués`,
          'debug'
        );
        newData = patch.getChangedFromDiff(target.toJSON(), patch.changes);
        await target.update({ set: newData });
      } else {
        throw new APIError(
          'Aucun changement sur le patch ???',
          'EMPTY_CHANGES'
        );
      }
    }

    const newPatch = await patch.update({
      set: { status: 'ACCEPTED' },
      nullThrowErr: true,
    });

    DevLog(
      `Demande acceptée, ID Groupe: ${newPatch.target.id}, ID Demande: ${newPatch.id}`,
      'debug'
    );

    return {
      patch: newPatch,
      data: newData,
    };
  }

  public async reject_patch(
    groupeID: string,
    patchID: string
    // params: IMediaVerifyBody
  ) {
    DevLog("Refus d'une demande de modification d'un groupe...", 'debug');
    this.needSession(this.session);
    const patch = await Patch.get(patchID, {
      nullThrowErr: true,
      json: false,
    });

    if (!patch.targetIdIs(groupeID))
      throw new APIError(
        "L'identifiant de l'groupe n'est pas celui qui est lié a la requête",
        'BAD_REQUEST'
      );

    if (!patch.isPending())
      throw new APIError(
        'Vous ne pouvez pas accepter cette requête',
        'FORBIDDEN'
      );

    if (!patch.isCreate() && !patch.isUpdate())
      throw new APIError(
        'Vous ne pouvez pas accepter cette requête',
        'FORBIDDEN'
      );

    const target = await Groupe.get(patch.target.id, {
      nullThrowErr: true,
      json: false,
    });

    if (patch.type === 'CREATE') {
      // Suppression de l'groupe qui a été crée automatiquement dans le cadre de la demande;
      await target.delete({ nullThrowErr: true, session: this.session });
      // gérer le reccursive
    }

    // Gérer le reccursive
    // if (params.reccursive)
    //     await this.patchController.acceptPatchReferences(patch.id, params);

    const newPatch = await patch.update({
      set: { status: 'REJECTED' },
      nullThrowErr: true,
    });

    DevLog(
      `Demande refusée, ID Groupe: ${newPatch.target.id}, ID Demande: ${newPatch.id}`,
      'debug'
    );
    return {
      patch: newPatch,
      data: target.toJSON(),
    };
  }
}

export { GroupeController };
