import { ClientSession } from 'mongoose';
import { APIError } from '../_lib/error';
import { ICharacter, ITargetPath, IUser } from '@actunime/types';
import {
  ICharacterAddBody,
  ICharacterBody,
  ICharacterCreateBody,
  IMediaDeleteBody,
} from '@actunime/validations';
import { UtilControllers } from '../_utils/_controllers';
import { DevLog } from '../_lib/logger';
import { genPublicID } from '@actunime/utils';
import { PersonController } from './person.controller';
import { ImageController } from './image.controller';
import LogSession from '../_utils/_logSession';
import { Character } from '../_lib/media/_character';
import { Patch } from '../_lib/media';

class CharacterController extends UtilControllers.withBasic {
  private targetPath: ITargetPath = 'Character';
  private user: IUser;
  constructor(
    session: ClientSession,
    options: { log?: LogSession; user: IUser }
  ) {
    super(session, options);
    this.user = options.user;
  }

  async build(
    input: ICharacterBody,
    params: { refId: string; isRequest: boolean; characterId?: string }
  ) {
    const { actors, avatar, ...rawCharacter } = input;
    const character: Partial<ICharacter> & { id: string } = {
      ...rawCharacter,
      isVerified: false,
      id: params.characterId || genPublicID(8),
    };

    const session = this.session;
    this.needSession(session);

    if (params.characterId) {
      // Vérification que l'character existe;
      const get = await Character.get(params.characterId, {
        cache: '5s',
        nullThrowErr: true,
        session,
      });
      // Valeur a synchroniser;
      character.isVerified = get.isVerified;
    }

    const user = this.user;

    DevLog(`Build character... ID: ${character.id}`, 'debug');

    const { refId, isRequest } = params;

    const imageController = new ImageController(session, {
      log: this.log,
      user,
    });

    const coverData = await imageController.add(
      avatar,
      refId,
      isRequest,
      { id: character.id },
      this.targetPath
    );

    if (coverData) character.avatar = { id: coverData.id };

    const personController = new PersonController(session, {
      log: this.log,
      user,
    });

    const actorData = await personController.bulkAdd(actors, refId, isRequest);

    character.actors = actorData?.items;

    return new Character(character, this.session);
  }

  public async add(
    item: ICharacterAddBody | undefined,
    refId: string,
    isRequest: boolean
  ) {
    const session = this.session;
    if (item?.id) {
      const get = await Character.get(item.id, {
        nullThrowErr: true,
        session,
      });
      return { id: get.id, role: item.role };
    } else if (item?.newCharacter) {
      if (isRequest) {
        const { data, patch } = await this.create_request(item.newCharacter!, {
          refId,
        });
        return { id: data.id, role: item.role, patch };
      } else {
        const { data, patch } = await this.create(item.newCharacter!, {
          refId,
        });
        return { id: data.id, role: item.role, patch };
      }
    } else if (item)
      throw new APIError(
        'Vous devez fournir un personnage valide',
        'BAD_REQUEST'
      );
    return;
  }

  public async bulkAdd(
    characters: ICharacterAddBody[] | undefined,
    refId: string,
    isRequest: boolean
  ) {
    if (!characters?.length) return undefined;
    const items = await Promise.all(
      characters.map(async (character) => this.add(character, refId, isRequest))
    );
    return {
      items: items
        .filter((data) => data?.id)
        .map((data) => ({ id: data!.id, role: data!.role })),
      patchs: items.filter((data) => data?.patch).map((data) => data!.patch!),
    };
  }
  public async create(
    data: ICharacterCreateBody['data'],
    params: Omit<ICharacterCreateBody, 'data'> & { refId?: string }
  ) {
    DevLog("Création de l'character...", 'debug');
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

    this.log?.add("Création d'un character", [
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
      `Character créé... ID Character: ${saved.id}, ID Maj: ${patchID}`,
      'debug'
    );
    return {
      data: saved,
      patch: newPatch,
    };
  }

  public async update(
    id: string,
    data: ICharacterCreateBody['data'],
    params: Omit<ICharacterCreateBody, 'data'> & { refId?: string }
  ) {
    DevLog("Mise à jour de l'character...", 'debug');
    this.needSession(this.session);
    const patchID = genPublicID(8);
    const build = await this.build(data, {
      refId: patchID,
      isRequest: false,
      characterId: id,
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

    this.log?.add("Modification d'un character", [
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
      `Character mis à jour, ID Character: ${build.id}, ID Maj: ${patchID}`,
      'debug'
    );

    return {
      data: updated,
      patch: newPatch.toJSON(),
    };
  }

  public async delete(id: string, params: IMediaDeleteBody) {
    DevLog("Suppression de l'character...", 'debug');
    this.needSession(this.session);
    const media = await Character.get(id, {
      json: false,
      nullThrowErr: true,
      session: this.session,
    });
    const deleted = await media.delete({ nullThrowErr: true });
    const patchID = genPublicID(8);

    if (media.isVerified) {
      // Créez un patch que si l'character était un character vérifié;
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

      this.log?.add("Suppresion d'un character", [
        { name: 'Nom', content: media.name.default },
        { name: 'ID', content: media.id },
        { name: 'Raison', content: params.reason },
        {
          name: 'Modérateur',
          content: `${this.user.username} (${this.user.id})`,
        },
      ]);

      DevLog(
        `Character supprimé, ID Character: ${media.id}, ID Maj: ${patchID}`,
        'debug'
      );

      return {
        data: deleted,
        patch: newPatch.toJSON(),
      };
    }

    DevLog(
      `Character non supprimé ou inexistant ou bug ???, ID Character: ${media.id}`,
      'debug'
    );

    return {
      data: deleted,
    };
  }

  public async verify(id: string) {
    DevLog("Verification de l'character...", 'debug');
    const media = await Character.get(id, {
      json: false,
      nullThrowErr: true,
      session: this.session,
    });
    await media.setVerified(true);
    DevLog(`Character verifié, ID Character: ${media.id}`, 'debug');
    return media.toJSON();
  }

  public async unverify(id: string) {
    DevLog("Verification de l'character...", 'debug');
    const media = await Character.get(id, {
      json: false,
      nullThrowErr: true,
      session: this.session,
    });
    await media.setUnverified(true);
    DevLog(`Character non verifié, ID Character: ${media.id}`, 'debug');
    return media.toJSON();
  }

  public async create_request(
    data: ICharacterCreateBody['data'],
    params: Omit<ICharacterCreateBody, 'data'> & { refId?: string }
  ) {
    DevLog("Demande de création d'un character...", 'debug');
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

    this.log?.add("Demande de création d'un character", [
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
      `Character créé, Demande crée... ID Character: ${build.id}, ID Demande: ${patchID}`,
      'debug'
    );

    return {
      data: build.toJSON(),
      patch: newPatch.toJSON(),
    };
  }

  public async update_request(
    id: string,
    data: ICharacterCreateBody['data'],
    params: Omit<ICharacterCreateBody, 'data'> & { refId?: string }
  ) {
    DevLog("Demande de modification d'un character...", 'debug');
    const patchID = genPublicID(8);
    const build = await this.build(data, {
      refId: patchID,
      isRequest: true,
      characterId: id,
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

    this.log?.add("Demande de modification d'un character", [
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
      `Demande crée, ID Character: ${build.id}, ID Demande: ${patchID}`,
      'debug'
    );

    return {
      data: build.toJSON(),
      patch: newPatch.toJSON(),
    };
  }

  public async update_patch(
    characterID: string,
    patchID: string,
    data: ICharacterCreateBody['data'],
    params: Omit<ICharacterCreateBody, 'data'>
  ) {
    DevLog(
      "Modification d'une demande de modification d'un character...",
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

    if (!request.targetIdIs(characterID))
      throw new APIError(
        "L'identifiant de l'character n'est pas celui qui est lié a la requête",
        'BAD_REQUEST'
      );

    const newPatchData = await this.build(data, {
      refId: request.id,
      isRequest: true,
      characterId: characterID,
    });

    const { changes } = await newPatchData.getDBDiff();
    if (!changes)
      throw new APIError("Aucun changement n'a été détecté !", 'EMPTY_CHANGES');

    // Création du PATCH de modification pour un suivi en status ACCEPTED pour un suivi;
    const newPatch = new Patch(
      {
        id: genPublicID(8),
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
      `Demande modifiée, ID Character: ${characterID}, ID Demande: ${newRequest.id}`,
      'debug'
    );

    return {
      data: newPatchData.toJSON(),
      patch: newPatch.toJSON(),
    };
  }

  public async accept_patch(
    characterID: string,
    patchID: string
    // params: IMediaVerifyBody
  ) {
    DevLog(
      "Acceptation d'une demande de modification d'un character...",
      'debug'
    );
    const patch = await Patch.get(patchID, {
      nullThrowErr: true,
      json: false,
    });

    if (!patch.targetIdIs(characterID))
      throw new APIError(
        "L'identifiant de l'character n'est pas celui qui est lié a la requête",
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

    const target = await Character.get(patch.target.id, {
      nullThrowErr: true,
      json: false,
      session: this.session,
    });

    let newData: ICharacter;
    if (patch.isCreate()) {
      if (patch.changes) {
        DevLog(
          `Le patch contient des changements qui vont être appliqués`,
          'debug'
        );
        newData = Patch.getChangedFromDiff(target.toJSON(), patch.changes);
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
        newData = Patch.getChangedFromDiff(target.toJSON(), patch.changes);
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
      `Demande acceptée, ID Character: ${newPatch.target.id}, ID Demande: ${newPatch.id}`,
      'debug'
    );

    return {
      patch: newPatch,
      data: newData,
    };
  }

  public async reject_patch(
    characterID: string,
    patchID: string
    // params: IMediaVerifyBody
  ) {
    DevLog("Refus d'une demande de modification d'un character...", 'debug');
    this.needSession(this.session);
    const patch = await Patch.get(patchID, {
      nullThrowErr: true,
      json: false,
    });

    if (!patch.targetIdIs(characterID))
      throw new APIError(
        "L'identifiant de l'character n'est pas celui qui est lié a la requête",
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

    const target = await Character.get(patch.target.id, {
      nullThrowErr: true,
      json: false,
    });

    if (patch.type === 'CREATE') {
      // Suppression de l'character qui a été crée automatiquement dans le cadre de la demande;
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
      `Demande refusée, ID Character: ${newPatch.target.id}, ID Demande: ${newPatch.id}`,
      'debug'
    );

    return {
      patch: newPatch,
      data: target.toJSON(),
    };
  }
}

export { CharacterController };
