import { ClientSession } from 'mongoose';
import { ITargetPath, IUser } from '@actunime/types';
import { UtilControllers } from '../_utils/_controllers';
import LogSession from '../_utils/_logSession';
import { DevLog, genPublicID } from '@actunime/utils';
import {
  IMediaDeleteBody,
  IUserAddBody,
  IUserBody,
  IUserCreateBody,
} from '@actunime/validations';
import { User } from '../_lib/media/_user';
import { Patch } from '../_lib/media';
import { ImageController } from './image.controller';
import { APIError } from '../_lib/error';

class UserController extends UtilControllers.withBasic {
  private targetPath: ITargetPath = 'User';
  private user: IUser;
  constructor(
    session: ClientSession,
    options: { log?: LogSession; user: IUser }
  ) {
    super(session, options);
    this.user = options.user;
  }

  async build(
    input: IUserBody,
    params: { refId: string; isRequest: boolean; userId?: string }
  ) {
    const { avatar, banner, ...rawUser } = input;
    const user: Partial<IUser> & { id: string } = {
      ...rawUser,
      id: params.userId || genPublicID(8),
    };

    const session = this.session;
    this.needSession(session);

    if (params?.userId) {
      // Vérification que l'user existe;
      const get = await User.get(params.userId, {
        cache: '5s',
        nullThrowErr: true,
        session,
      });
      // Valeur a synchroniser;
      user.permissions = get.permissions;
      user.accountId = get.accountId;
      user.username = get.username;
    }
    
    const { refId, isRequest } = params;
    DevLog(`Build de la userne...`, 'debug');

    const imageController = new ImageController(session, {
      user: this.user,
      log: this.log,
    });

    const avatarData = await imageController.add(
      avatar,
      refId,
      isRequest,
      { id: this.user.id },
      this.targetPath
    );

    if (avatarData) user.avatar = { id: avatarData.id };

    const bannerData = await imageController.add(
      banner,
      refId,
      isRequest,
      { id: this.user.id },
      this.targetPath
    );

    if (bannerData) user.banner = { id: bannerData.id };

    return new User(user, this.session);
  }

  public async add(item: IUserAddBody | undefined) {
    const session = this.session;
    if (item?.id) {
      const get = await User.get(item.id, {
        nullThrowErr: true,
        session,
      });
      return { id: get.id };
    } else if (item)
      throw new APIError(
        'Vous devez fournir un utilisateur valide',
        'BAD_REQUEST'
      );
    return;
  }

  public async bulkAdd(mangas: IUserAddBody[] | undefined) {
    if (!mangas?.length) return undefined;
    const items = await Promise.all(
      mangas.map(async (manga) => this.add(manga))
    );

    return {
      items: items.filter((data) => data?.id).map((data) => ({ id: data!.id })),
    };
  }

  public async create(
    data: IUserBody,
    params: Omit<IUserCreateBody, 'data'> & { refId?: string }
  ) {
    DevLog("Création de l'user...", 'debug');
    this.needSession(this.session);
    const patchID = genPublicID(8);
    const build = await this.build(data, { refId: patchID, isRequest: false });

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

    this.log?.add("Création d'un user", [
      { name: 'Nom', content: build.displayName },
      { name: 'ID', content: build.id },
      { name: 'MajID', content: patchID },
      { name: 'Description', content: params.description },
      {
        name: 'Modérateur',
        content: `${this.user.username} (${this.user.id})`,
      },
    ]);

    const saved = await build.save({ nullThrowErr: true });

    DevLog(`User créé... ID User: ${saved.id}, ID Maj: ${patchID}`, 'debug');

    return {
      patch: newPatch.toJSON(),
      data: saved,
    };
  }

  public async update(
    id: string,
    data: IUserCreateBody['data'],
    params: Omit<IUserCreateBody, 'data'> & { refId?: string }
  ) {
    DevLog("Mise à jour de l'user...", 'debug');
    this.needSession(this.session);
    const patchID = genPublicID(8);
    const build = await this.build(data, {
      refId: patchID,
      isRequest: false,
      userId: id,
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
      },
      this.session
    );

    await newPatch.save({ nullThrowErr: true });

    this.log?.add("Modification d'un user", [
      { name: 'Nom', content: build.displayName },
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
      `User mis à jour, ID User: ${build.id}, ID Maj: ${patchID}`,
      'debug'
    );

    return {
      patch: newPatch.toJSON(),
      data: updated,
    };
  }

  public async delete(id: string, params: IMediaDeleteBody) {
    DevLog("Suppression de l'user...", 'debug');
    this.needSession(this.session);
    const media = await User.get(id, {
      json: false,
      nullThrowErr: true,
      session: this.session,
    });
    const deleted = await media.delete({ nullThrowErr: true });
    const patchID = genPublicID(8);

    // Créez un patch que si l'user était un user vérifié;
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

    this.log?.add("Suppresion d'un user", [
      { name: 'Nom', content: media.displayName },
      { name: 'ID', content: media.id },
      { name: 'Raison', content: params.reason },
      {
        name: 'Modérateur',
        content: `${this.user.username} (${this.user.id})`,
      },
    ]);

    DevLog(`User supprimé, ID User: ${media.id}, ID Maj: ${patchID}`, 'debug');

    return {
      patch: newPatch.toJSON(),
      data: deleted,
    };
  }

  public async delete_patch(
    personID: string,
    patchID: string
    // params: IMediaDeleteBody
  ) {
    DevLog("Suppression d'une demande de modification d'un person...", 'debug');
    const request = await Patch.get(patchID, {
      nullThrowErr: true,
      json: false,
      session: this.session,
    });

    if (!request.targetIdIs(personID))
      throw new APIError(
        "L'identifiant de l'person n'est pas celui qui est lié a la requête",
        'BAD_REQUEST'
      );

    const deleted = await request.delete({ nullThrowErr: true });

    // Gérer le reccursive
    // if (params.deleteTarget)
    //     await this.delete(request.target.id, params, ["PERSON_REQUEST_DELETE"]);

    DevLog(
      `Demande supprimée (${deleted}), ID Person: ${request.target.id}, ID Demande: ${request.id}`,
      'debug'
    );

    return {
      patch: deleted,
    };
  }
}

export { UserController };
