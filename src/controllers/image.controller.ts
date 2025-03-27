import { ClientSession } from 'mongoose';
import { APIError } from '../_lib/error';
import {
  IImageAddBody,
  IImageBody,
  IMediaDeleteBody,
} from '@actunime/validations';
import { IImage, ITargetPath, IUser } from '@actunime/types';
import { UtilControllers } from '../_utils/_controllers';
import { DevLog } from '../_lib/logger';
import { genPublicID } from '@actunime/utils';
import { Checker } from '../_utils/_checker';
import LogSession from '../_utils/_logSession';
import { Image } from '../_lib/media/_image';
import { Patch } from '../_lib/media';

interface ImageParams {
  refId?: string;
  description?: string;
  target: { id: string };
  targetPath: ITargetPath;
}

interface ImageFile {
  id: string;
  path: ITargetPath;
  value: string;
  valueIsUrl: boolean;
}

class ImageController extends UtilControllers.withBasic {
  static saveImages: {
    data: ImageFile;
    session_id: ClientSession['id'];
  }[] = [];
  static deleteImages: {
    data: {
      id: string;
      path: ITargetPath;
    };
    session_id: ClientSession['id'];
  }[] = [];
  private targetPath: ITargetPath = 'Image';
  private user: IUser;
  constructor(
    session: ClientSession,
    options: { log?: LogSession; user: IUser }
  ) {
    super(session, options);
    this.user = options.user;
  }

  async build(input: IImageBody, params: ImageParams & { imageID?: string }) {
    const { value, ...rawImage } = input;
    const image: Partial<IImage> &
      Required<{ id: string; targetPath: ITargetPath }> = {
      ...rawImage,
      target: params.target,
      targetPath: params.targetPath,
      id: params.imageID || genPublicID(8),
      isVerified: false,
    };
    const session = this.session;
    this.needSession(session);
    if (params?.imageID) {
      // Vérification que l'anime existe;
      const get = await Image.get(params.imageID, {
        cache: '5s',
        nullThrowErr: true,
        session,
      });
      // Valeur a synchroniser;
      image.isVerified = get.isVerified;
    }

    ImageController.saveImages.push({
      data: {
        id: image.id,
        path: image.targetPath,
        value,
        valueIsUrl: Checker.textHasLink(value),
      },
      session_id: this.session?.id,
    });

    DevLog(`Build Image...`);
    return new Image(image, this.session);
  }

  public async add(
    item: IImageAddBody | undefined,
    refId: string,
    isRequest: boolean,
    target: { id: string },
    targetPath: ITargetPath
  ) {
    const session = this.session;
    if (item?.id) {
      const get = await Image.get(item.id, {
        nullThrowErr: true,
        session,
      });
      return { id: get.id };
    } else if (item?.newImage) {
      if (isRequest) {
        const { data, patch } = await this.create_request(item.newImage!, {
          refId,
          target,
          targetPath,
        });
        return { id: data.id, patch };
      } else {
        const { data, patch } = await this.create(item.newImage!, {
          refId,
          target,
          targetPath,
        });
        return { id: data.id, patch };
      }
    } else if (item)
      throw new APIError('Vous devez fournir une image valide', 'BAD_REQUEST');
    return;
  }

  public async bulkAdd(
    images: IImageAddBody[] | undefined,
    refId: string,
    isRequest: boolean,
    target: { id: string },
    targetPath: ITargetPath
  ) {
    if (!images?.length) return undefined;
    const items = await Promise.all(
      images.map(async (image) =>
        this.add(image, refId, isRequest, target, targetPath)
      )
    );
    return {
      items: items.filter((data) => data?.id).map((data) => ({ id: data!.id })),
      patchs: items.filter((data) => data?.patch).map((data) => data!.patch!),
    };
  }

  public async create(data: IImageBody, params: ImageParams) {
    DevLog("Création d'une image...", 'debug');
    this.needSession(this.session);
    const patchID = genPublicID(8);
    const build = await this.build(data, params);
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
    const saved = await build.save({ nullThrowErr: true });

    this.log?.add("Création d'une image", [
      { name: 'CibleID', content: saved.target.id },
      { name: 'CibleType', content: saved.targetPath },
      { name: 'Label', content: saved.label },
      { name: 'ID', content: saved.id },
      { name: 'MajID', content: patchID },
      { name: 'Description', content: params.description },
      {
        name: 'Modérateur',
        content: `${this.user.username} (${this.user.id})`,
      },
    ]);

    DevLog(`Image crée, ID Image: ${saved.id}`, 'debug');

    return {
      data: saved,
      patch: newPatch.toJSON(),
    };
  }

  public async update(id: string, data: IImageBody, params: ImageParams) {
    DevLog("Modification d'une image...", 'debug');
    this.needSession(this.session);
    const patchID = genPublicID(8);
    const build = await this.build(data, { ...params, imageID: id });
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
    const updated = await build.update({ nullThrowErr: true });

    this.log?.add("Modification d'une image", [
      { name: 'CibleID', content: build.target.id },
      { name: 'CibleType', content: build.targetPath },
      { name: 'Label', content: build.label },
      { name: 'ID', content: build.id },
      { name: 'MajID', content: patchID },
      { name: 'Description', content: params.description },
      {
        name: 'Modérateur',
        content: `${this.user.username} (${this.user.id})`,
      },
    ]);

    DevLog(`Image modifiée, ID Image: ${build.id}`, 'debug');
    return {
      data: updated,
      patch: newPatch.toJSON(),
    };
  }

  public async delete(id: string, params: IMediaDeleteBody) {
    DevLog("Suppression d'une image...", 'debug');
    this.needSession(this.session);
    const media = await Image.get(id, {
      json: false,
      nullThrowErr: true,
      session: this.session,
    });
    const deleted = await media.delete({ nullThrowErr: true });
    const patchID = genPublicID(8);

    if (media.isVerified) {
      // Créez un patch que si l'image était un image vérifié;
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

      this.log?.add("Suppresion d'un image", [
        { name: 'ID', content: media.id },
        { name: 'Raison', content: params.reason },
        {
          name: 'Modérateur',
          content: `${this.user.username} (${this.user.id})`,
        },
      ]);

      DevLog(
        `Image supprimé, ID Image: ${media.id}, ID Maj: ${patchID}`,
        'debug'
      );

      return {
        data: deleted,
        patch: newPatch.toJSON(),
      };
    }

    DevLog(
      `Image non supprimé ou inexistant ou bug ???, ID Image: ${media.id}`,
      'debug'
    );
    return {
      data: deleted,
    };
  }

  public async verify(id: string) {
    DevLog("Verification de l'image...", 'debug');
    const media = await Image.get(id, {
      json: false,
      nullThrowErr: true,
      session: this.session,
    });
    await media.setVerified(true);
    DevLog(`Image verifié, ID Image: ${media.id}`, 'debug');
    return media.toJSON();
  }

  public async unverify(id: string) {
    DevLog("Verification de l'image...", 'debug');
    const media = await Image.get(id, {
      json: false,
      nullThrowErr: true,
      session: this.session,
    });
    await media.setUnverified(true);
    DevLog(`Image non verifié, ID Image: ${media.id}`, 'debug');
    return media.toJSON();
  }

  public async create_request(data: IImageBody, params: ImageParams) {
    DevLog("Creation de la demande de l'image...", 'debug');
    const refId = genPublicID(8);
    const build = await this.build(data, params);
    build.setUnverified();

    const newPatch = new Patch(
      {
        ...(params.refId && { ref: { id: params.refId } }),
        id: refId,
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

    this.log?.add("Demande de création d'une image", [
      { name: 'CibleID', content: build.target.id },
      { name: 'CibleType', content: build.targetPath },
      { name: 'Label', content: build.label },
      { name: 'ID', content: build.id },
      { name: 'MajID', content: refId },
      { name: 'Description', content: params.description },
      {
        name: 'Modérateur',
        content: `${this.user.username} (${this.user.id})`,
      },
    ]);

    DevLog(
      `Image crée, Demande crée... ID Image: ${build.id}, ID Demande: ${refId}`,
      'debug'
    );

    return {
      data: build.toJSON(),
      patch: newPatch.toJSON(),
    };
  }
  
  public async accept_patch(
    imageID: string,
    patchID: string
    // params: IMediaVerifyBody
  ) {
    DevLog("Acceptation d'une demande de modification d'un image...", 'debug');
    const patch = await Patch.get(patchID, {
      nullThrowErr: true,
      json: false,
    });

    if (!patch.targetIdIs(imageID))
      throw new APIError(
        "L'identifiant de l'image n'est pas celui qui est lié a la requête",
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

    const target = await Image.get(patch.target.id, {
      nullThrowErr: true,
      json: false,
      session: this.session,
    });

    let newData: IImage;
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
      `Demande acceptée, ID Image: ${newPatch.target.id}, ID Demande: ${newPatch.id}`,
      'debug'
    );

    return {
      patch: newPatch,
      data: newData,
    };
  }

  public async reject_patch(
    imageID: string,
    patchID: string
    // params: IMediaVerifyBody
  ) {
    DevLog("Refus d'une demande de modification d'un image...", 'debug');
    this.needSession(this.session);
    const patch = await Patch.get(patchID, {
      nullThrowErr: true,
      json: false,
    });

    if (!patch.targetIdIs(imageID))
      throw new APIError(
        "L'identifiant de l'image n'est pas celui qui est lié a la requête",
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

    const target = await Image.get(patch.target.id, {
      nullThrowErr: true,
      json: false,
    });

    if (patch.type === 'CREATE') {
      // Suppression de l'image qui a été crée automatiquement dans le cadre de la demande;
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
      `Demande refusée, ID Image: ${newPatch.target.id}, ID Demande: ${newPatch.id}`,
      'debug'
    );
    return {
      patch: newPatch,
      data: target.toJSON(),
    };
  }
}

export { ImageController };
