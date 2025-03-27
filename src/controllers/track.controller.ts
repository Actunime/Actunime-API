import { ClientSession } from 'mongoose';
import { APIError } from '../_lib/error';
import { ITrack, ITargetPath, IUser } from '@actunime/types';
import {
  ITrackBody,
  IMediaDeleteBody,
  ITrackCreateBody,
  ITrackAddBody,
} from '@actunime/validations';
import { UtilControllers } from '../_utils/_controllers';
import { DevLog } from '../_lib/logger';
import { genPublicID } from '@actunime/utils';
import { ImageController } from './image.controller';
import LogSession from '../_utils/_logSession';
import { Track } from '../_lib/media/_track';
import { Patch } from '../_lib/media';
import { PersonController } from './person.controller';

class TrackController extends UtilControllers.withBasic {
  private targetPath: ITargetPath = 'Track';
  private user: IUser;
  constructor(
    session: ClientSession,
    options: { log?: LogSession; user: IUser }
  ) {
    super(session, options);
    this.user = options.user;
  }

  async build(
    input: ITrackBody,
    params: { refId: string; isRequest: boolean; trackId?: string }
  ) {
    const { artists, cover, ...rawTrack } = input;
    const track: Partial<ITrack> & { id: string } = {
      ...rawTrack,
      id: params.trackId || genPublicID(8),
      isVerified: false,
    };
    const session = this.session;
    this.needSession(session);
    if (params?.trackId) {
      // Vérification que l'anime existe;
      const get = await Track.get(params.trackId, {
        cache: '5s',
        nullThrowErr: true,
        session,
      });
      // Valeur a synchroniser;
      track.isVerified = get.isVerified;
    }
    const user = this.user;

    const { refId, isRequest } = params;
    DevLog('Build de musique...', 'debug');
    const imageController = new ImageController(session, {
      user,
      log: this.log,
    });

    const imageData = await imageController.add(
      cover,
      refId,
      isRequest,
      { id: track.id },
      this.targetPath
    );

    if (imageData) track.cover = { id: imageData.id };

    const personController = new PersonController(session, {
      user,
      log: this.log,
    });
    const personData = await personController.bulkAdd(
      artists,
      refId,
      isRequest
    );
    track.artists = personData?.items;

    return new Track(track, this.session);
  }

  public async add(
    item: ITrackAddBody | undefined,
    refId: string,
    isRequest: boolean
  ) {
    const session = this.session;
    if (item?.id) {
      const get = await Track.get(item.id, {
        nullThrowErr: true,
        session,
      });
      return { id: get.id };
    } else if (item?.newTrack) {
      if (isRequest) {
        const { data, patch } = await this.create_request(item.newTrack!, {
          refId,
        });
        return { id: data.id, patch };
      } else {
        const { data, patch } = await this.create(item.newTrack!, {
          refId,
        });
        return { id: data.id, patch };
      }
    } else if (item)
      throw new APIError(
        'Vous devez fournir une musique valide',
        'BAD_REQUEST'
      );
    return;
  }

  public async bulkAdd(
    tracks: ITrackAddBody[] | undefined,
    refId: string,
    isRequest: boolean
  ) {
    if (!tracks?.length) return undefined;
    const items = await Promise.all(
      tracks.map(async (track) => this.add(track, refId, isRequest))
    );
    return {
      items: items.filter((data) => data?.id).map((data) => ({ id: data!.id })),
      patchs: items.filter((data) => data?.patch).map((data) => data!.patch!),
    };
  }

  public async create(
    data: ITrackCreateBody['data'],
    params: Omit<ITrackCreateBody, 'data'> & { refId?: string }
  ) {
    DevLog("Création de l'track...", 'debug');
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

    this.log?.add("Création d'un track", [
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

    DevLog(`Track créé... ID Track: ${saved.id}, ID Maj: ${patchID}`, 'debug');
    return {
      data: saved,
      patch: newPatch.toJSON(),
    };
  }

  public async update(
    id: string,
    data: ITrackCreateBody['data'],
    params: Omit<ITrackCreateBody, 'data'> & { refId?: string }
  ) {
    DevLog("Mise à jour de l'track...", 'debug');
    this.needSession(this.session);
    const patchID = genPublicID(8);
    const build = await this.build(data, {
      refId: patchID,
      isRequest: false,
      trackId: id,
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

    this.log?.add("Modification d'un track", [
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
      `Track mis à jour, ID Track: ${build.id}, ID Maj: ${patchID}`,
      'debug'
    );

    return {
      data: updated,
      patch: newPatch.toJSON(),
    };
  }

  public async delete(id: string, params: IMediaDeleteBody) {
    DevLog("Suppression de l'track...", 'debug');
    this.needSession(this.session);
    const media = await Track.get(id, {
      json: false,
      nullThrowErr: true,
      session: this.session,
    });
    const deleted = await media.delete({ nullThrowErr: true });
    const patchID = genPublicID(8);

    if (media.isVerified) {
      // Créez un patch que si l'track était un track vérifié;
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

      this.log?.add("Suppresion d'un track", [
        { name: 'Nom', content: media.name.default },
        { name: 'ID', content: media.id },
        { name: 'Raison', content: params.reason },
        {
          name: 'Modérateur',
          content: `${this.user.username} (${this.user.id})`,
        },
      ]);

      DevLog(
        `Track supprimé, ID Track: ${media.id}, ID Maj: ${patchID}`,
        'debug'
      );

      return {
        data: deleted,
        patch: newPatch.toJSON(),
      };
    }

    DevLog(
      `Track non supprimé ou inexistant ou bug ???, ID Track: ${media.id}`,
      'debug'
    );
    return {
      data: deleted,
    };
  }

  public async verify(id: string) {
    DevLog("Verification de l'track...", 'debug');
    const media = await Track.get(id, {
      json: false,
      nullThrowErr: true,
      session: this.session,
    });
    await media.setVerified(true);
    DevLog(`Track verifié, ID Track: ${media.id}`, 'debug');
    return media.toJSON();
  }

  public async unverify(id: string) {
    DevLog("Verification de l'track...", 'debug');
    const media = await Track.get(id, {
      json: false,
      nullThrowErr: true,
      session: this.session,
    });
    await media.setUnverified(true);
    DevLog(`Track non verifié, ID Track: ${media.id}`, 'debug');
    return media.toJSON();
  }

  public async create_request(
    data: ITrackCreateBody['data'],
    params: Omit<ITrackCreateBody, 'data'> & { refId?: string }
  ) {
    DevLog("Demande de création d'un track...", 'debug');
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

    this.log?.add("Demande de création d'un track", [
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
      `Track créé, Demande crée... ID Track: ${build.id}, ID Demande: ${patchID}`,
      'debug'
    );
    return {
      data: build.toJSON(),
      patch: newPatch.toJSON(),
    };
  }

  public async update_request(
    id: string,
    data: ITrackCreateBody['data'],
    params: Omit<ITrackCreateBody, 'data'> & { refId?: string }
  ) {
    DevLog("Demande de modification d'un track...", 'debug');
    const patchID = genPublicID(8);
    const build = await this.build(data, {
      refId: patchID,
      isRequest: true,
      trackId: id,
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

    this.log?.add("Demande de modification d'un track", [
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
      `Demande crée, ID Track: ${build.id}, ID Demande: ${patchID}`,
      'debug'
    );
    return {
      data: build.toJSON(),
      patch: newPatch.toJSON(),
    };
  }

  public async update_patch(
    trackID: string,
    patchID: string,
    data: ITrackCreateBody['data'],
    params: Omit<ITrackCreateBody, 'data'>
  ) {
    DevLog("Modification d'une demande de modification d'un track...", 'debug');
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

    if (!request.targetIdIs(trackID))
      throw new APIError(
        "L'identifiant de l'track n'est pas celui qui est lié a la requête",
        'BAD_REQUEST'
      );

    const newPatchData = await this.build(data, {
      refId: request.id,
      isRequest: true,
      trackId: trackID,
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
      `Demande modifiée, ID Track: ${trackID}, ID Demande: ${newRequest.id}`,
      'debug'
    );

    return {
      data: newPatchData.toJSON(),
      patch: newPatch.toJSON(),
    };
  }

  public async accept_patch(
    trackID: string,
    patchID: string
    // params: IMediaVerifyBody
  ) {
    DevLog("Acceptation d'une demande de modification d'un track...", 'debug');
    const patch = await Patch.get(patchID, {
      nullThrowErr: true,
      json: false,
    });

    if (!patch.targetIdIs(trackID))
      throw new APIError(
        "L'identifiant de l'track n'est pas celui qui est lié a la requête",
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

    const target = await Track.get(patch.target.id, {
      nullThrowErr: true,
      json: false,
      session: this.session,
    });

    let newData: ITrack;
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
      `Demande acceptée, ID Track: ${newPatch.target.id}, ID Demande: ${newPatch.id}`,
      'debug'
    );

    return {
      patch: newPatch,
      data: newData,
    };
  }

  public async reject_patch(
    trackID: string,
    patchID: string
    // params: IMediaVerifyBody
  ) {
    DevLog("Refus d'une demande de modification d'un track...", 'debug');
    this.needSession(this.session);
    const patch = await Patch.get(patchID, {
      nullThrowErr: true,
      json: false,
    });

    if (!patch.targetIdIs(trackID))
      throw new APIError(
        "L'identifiant de l'track n'est pas celui qui est lié a la requête",
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

    const target = await Track.get(patch.target.id, {
      nullThrowErr: true,
      json: false,
    });

    if (patch.type === 'CREATE') {
      // Suppression de l'track qui a été crée automatiquement dans le cadre de la demande;
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
      `Demande refusée, ID Track: ${newPatch.target.id}, ID Demande: ${newPatch.id}`,
      'debug'
    );

    return {
      patch: newPatch,
      data: target.toJSON(),
    };
  }
}

export { TrackController };
