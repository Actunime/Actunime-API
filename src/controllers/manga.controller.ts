import { ClientSession } from 'mongoose';
import { APIError } from '../_lib/error';
import { IManga, ITargetPath, IUser } from '@actunime/types';
import {
  IMangaAddBody,
  IMangaCreateBody,
  IMediaDeleteBody,
} from '@actunime/validations';
import { UtilControllers } from '../_utils/_controllers';
import { GroupeController } from './groupe.controller';
import { ImageController } from './image.controller';
import { CompanyController } from './company.controller';
import { PersonController } from './person.controller';
import { CharacterController } from './character.controller';
import LogSession from '../_utils/_logSession';
import { DevLog } from '../_lib/logger';
import { genPublicID } from '@actunime/utils';
import { Manga } from '../_lib/media/_manga';
import { Patch } from '../_lib/media';

class MangaController extends UtilControllers.withBasic {
  // private patchController: PatchController;
  private groupeController: GroupeController;
  private imageController: ImageController;
  private companyController: CompanyController;
  private personController: PersonController;
  private characterController: CharacterController;
  private targetPath: ITargetPath = 'Manga';
  private user: IUser;
  constructor(
    session: ClientSession,
    options: { log?: LogSession; user: IUser }
  ) {
    super(session, options);
    this.user = options.user;
    // this.patchController = new PatchController(session, options);
    this.groupeController = new GroupeController(session, options);
    this.imageController = new ImageController(session, options);
    this.companyController = new CompanyController(session, options);
    this.personController = new PersonController(session, options);
    this.characterController = new CharacterController(session, options);
  }

  async build(
    input: IMangaCreateBody['data'],
    params: { refId: string; isRequest: boolean; mangaId?: string }
  ): Promise<Manga> {
    const {
      groupe,
      parent,
      cover,
      banner,
      companys,
      staffs,
      characters,
      ...rawManga
    } = input;
    const { refId, isRequest, mangaId } = params;
    const session = this.session;
    this.needSession(session);

    const manga: Partial<IManga> & Required<{ id: string }> = {
      ...rawManga,
      id: params.mangaId || genPublicID(8),
      isVerified: false,
    };

    if (mangaId) {
      // Vérification que l'manga existe;
      const getManga = await Manga.get(mangaId, {
        cache: '5s',
        nullThrowErr: true,
      });
      // Valeur a synchroniser;
      manga.isVerified = getManga.isVerified;
    }

    DevLog(`Build manga... ID: ${manga.id}`, 'debug');

    const groupeData = await this.groupeController.add(
      groupe,
      refId,
      isRequest
    );
    if (groupeData) manga.groupe = { id: groupeData.id };

    const mangaData = await this.add(parent);
    manga.parent = mangaData;

    const coverData = await this.imageController.add(
      cover,
      refId,
      isRequest,
      { id: manga.id },
      this.targetPath
    );

    if (coverData) manga.cover = { id: coverData.id };

    const bannerData = await this.imageController.add(
      banner,
      refId,
      isRequest,
      { id: manga.id },
      this.targetPath
    );

    if (bannerData) manga.banner = { id: bannerData.id };

    const companyData = await this.companyController.bulkAdd(
      companys,
      refId,
      isRequest
    );

    manga.companys = companyData?.items;

    const staffData = await this.personController.bulkAdd(
      staffs,
      refId,
      isRequest
    );

    manga.staffs = staffData?.items;

    const characterData = await this.characterController.bulkAdd(
      characters,
      refId,
      isRequest
    );

    manga.characters = characterData?.items;

    return new Manga(manga, this.session);
  }

  public async add(item: IMangaAddBody | undefined) {
    const session = this.session;
    if (item?.id) {
      const get = await Manga.get(item.id, {
        nullThrowErr: true,
        session,
      });
      return { id: get.id };
    } else if (item)
      throw new APIError('Vous devez fournir un manga valide', 'BAD_REQUEST');
    return;
  }

  public async bulkAdd(mangas: IMangaAddBody[] | undefined) {
    if (!mangas?.length) return undefined;
    const items = await Promise.all(
      mangas.map(async (manga) => this.add(manga))
    );

    return {
      items: items.filter((data) => data?.id).map((data) => ({ id: data!.id })),
    };
  }

  public async create(
    data: IMangaCreateBody['data'],
    params: Omit<IMangaCreateBody, 'data'>
  ) {
    DevLog("Création de l'manga...", 'debug');
    this.needSession(this.session);
    const refId = genPublicID(8);
    const build = await this.build(data, { refId, isRequest: false });
    build.setVerified();

    const newPatch = new Patch(
      {
        id: refId,
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

    this.log?.add("Création d'un manga", [
      { name: 'Nom', content: build.title.default },
      { name: 'ID', content: build.id },
      { name: 'MajID', content: refId },
      { name: 'Description', content: params.description },
      {
        name: 'Modérateur',
        content: `${this.user.username} (${this.user.id})`,
      },
    ]);

    const saved = await build.save({ nullThrowErr: true });

    DevLog(`Manga créé... ID Manga: ${saved.id}, ID Maj: ${refId}`, 'debug');
    return saved;
  }

  public async update(
    id: string,
    data: IMangaCreateBody['data'],
    params: Omit<IMangaCreateBody, 'data'>
  ) {
    DevLog("Mise à jour de l'manga...", 'debug');
    this.needSession(this.session);
    const patchID = genPublicID(8);
    const build = await this.build(data, {
      refId: patchID,
      isRequest: false,
      mangaId: id,
    });
    const { original, changes } = await build.getDBDiff();

    console.log('changements', changes);

    if (!changes || (changes && !changes.length))
      throw new APIError("Aucun changement n'a été détecté !", 'EMPTY_CHANGES');

    const newPatch = new Patch(
      {
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

    this.log?.add("Modification d'un manga", [
      { name: 'Nom', content: build.title.default },
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
      `Manga mis à jour, ID Manga: ${build.id}, ID Maj: ${patchID}`,
      'debug'
    );

    return updated;
  }

  public async delete(id: string, params: IMediaDeleteBody) {
    DevLog("Suppression de l'manga...", 'debug');
    this.needSession(this.session);
    const media = await Manga.get(id, {
      json: false,
      nullThrowErr: true,
      session: this.session,
    });
    const deleted = await media.delete({ nullThrowErr: true });
    const patchID = genPublicID(8);

    if (media.isVerified) {
      // Créez un patch que si l'manga était un manga vérifié;
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

      this.log?.add("Suppresion d'un manga", [
        { name: 'Nom', content: media.title.default },
        { name: 'ID', content: media.id },
        { name: 'Raison', content: params.reason },
        {
          name: 'Modérateur',
          content: `${this.user.username} (${this.user.id})`,
        },
      ]);

      DevLog(
        `Manga supprimé, ID Manga: ${media.id}, ID Maj: ${patchID}`,
        'debug'
      );
    }

    DevLog(
      `Manga non supprimé ou inexistant ou bug ???, ID Manga: ${media.id}`,
      'debug'
    );
    return deleted;
  }

  public async verify(id: string) {
    DevLog("Verification de l'manga...", 'debug');
    const media = await Manga.get(id, {
      json: false,
      nullThrowErr: true,
      session: this.session,
    });
    await media.setVerified(true);
    DevLog(`Manga verifié, ID Manga: ${media.id}`, 'debug');
    return media.toJSON();
  }

  public async unverify(id: string) {
    DevLog("Verification de l'manga...", 'debug');
    const media = await Manga.get(id, {
      json: false,
      nullThrowErr: true,
      session: this.session,
    });
    await media.setUnverified(true);
    DevLog(`Manga non verifié, ID Manga: ${media.id}`, 'debug');
    return media.toJSON();
  }

  public async create_request(
    data: IMangaCreateBody['data'],
    params: Omit<IMangaCreateBody, 'data'>
  ) {
    DevLog("Demande de création d'un manga...", 'debug');
    const refId = genPublicID(8);
    const build = await this.build(data, { refId, isRequest: true });
    build.setUnverified();

    const newPatch = new Patch(
      {
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

    this.log?.add("Demande de création d'un manga", [
      { name: 'Nom', content: build.title.default },
      { name: 'ID', content: build.id },
      { name: 'MajID', content: refId },
      { name: 'Description', content: params.description },
      {
        name: 'Modérateur',
        content: `${this.user.username} (${this.user.id})`,
      },
    ]);

    DevLog(
      `Manga créé, Demande crée... ID Manga: ${build.id}, ID Demande: ${refId}`,
      'debug'
    );
    return build.toJSON();
  }

  public async update_request(
    id: string,
    data: IMangaCreateBody['data'],
    params: Omit<IMangaCreateBody, 'data'>
  ) {
    DevLog("Demande de modification d'un manga...", 'debug');
    const refId = genPublicID(8);
    const build = await this.build(data, {
      refId,
      isRequest: true,
      mangaId: id,
    });
    const { changes } = await build.getDBDiff();
    console.log('changements', changes);

    if (!changes || (changes && !changes.length))
      throw new APIError("Aucun changement n'a été détecté !", 'EMPTY_CHANGES');

    const newPatch = new Patch(
      {
        id: refId,
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

    this.log?.add("Demande de modification d'un manga", [
      { name: 'Nom', content: build.title.default },
      { name: 'ID', content: build.id },
      { name: 'MajID', content: refId },
      { name: 'Description', content: params.description },
      {
        name: 'Modérateur',
        content: `${this.user.username} (${this.user.id})`,
      },
    ]);

    DevLog(
      `Demande crée, ID Manga: ${build.id}, ID Demande: ${refId}`,
      'debug'
    );
    return build.toJSON();
  }

  public async update_patch(
    mangaID: string,
    patchID: string,
    data: IMangaCreateBody['data'],
    params: Omit<IMangaCreateBody, 'data'>
  ) {
    DevLog("Modification d'une demande de modification d'un manga...", 'debug');
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

    if (!request.targetIdIs(mangaID))
      throw new APIError(
        "L'identifiant de l'manga n'est pas celui qui est lié a la requête",
        'BAD_REQUEST'
      );

    const newPatchData = await this.build(data, {
      refId: request.id,
      isRequest: true,
      mangaId: mangaID,
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
      `Demande modifiée, ID Manga: ${mangaID}, ID Demande: ${newRequest.id}`,
      'debug'
    );

    return newPatchData.toJSON();
  }

  public async accept_patch(
    mangaID: string,
    patchID: string
    // params: IMediaVerifyBody
  ) {
    DevLog("Acceptation d'une demande de modification d'un manga...", 'debug');
    const patch = await Patch.get(patchID, {
      nullThrowErr: true,
      json: false,
    });

    if (!patch.targetIdIs(mangaID))
      throw new APIError(
        "L'identifiant de l'manga n'est pas celui qui est lié a la requête",
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

    const target = await Manga.get(patch.target.id, {
      nullThrowErr: true,
      json: false,
      session: this.session,
    });

    let newData: IManga;
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
      `Demande acceptée, ID Manga: ${newPatch.target.id}, ID Demande: ${newPatch.id}`,
      'debug'
    );

    return {
      patch: newPatch,
      data: newData,
    };
  }

  public async reject_patch(
    mangaID: string,
    patchID: string
    // params: IMediaVerifyBody
  ) {
    DevLog("Refus d'une demande de modification d'un manga...", 'debug');
    this.needSession(this.session);
    const patch = await Patch.get(patchID, {
      nullThrowErr: true,
      json: false,
    });

    if (!patch.targetIdIs(mangaID))
      throw new APIError(
        "L'identifiant de l'manga n'est pas celui qui est lié a la requête",
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

    const target = await Manga.get(patch.target.id, {
      nullThrowErr: true,
      json: false,
    });

    if (patch.type === 'CREATE') {
      // Suppression de l'manga qui a été crée automatiquement dans le cadre de la demande;
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
      `Demande refusée, ID Manga: ${newPatch.target.id}, ID Demande: ${newPatch.id}`,
      'debug'
    );
    return target.toJSON();
  }
}

export { MangaController };
