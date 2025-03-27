import { ClientSession } from 'mongoose';
import { APIError } from '../_lib/error';
import { IAnime, IPatch, ITargetPath, IUser } from '@actunime/types';
import {
  IAnimeAddBody,
  IAnimeCreateBody,
  IMediaDeleteBody,
} from '@actunime/validations';
import { UtilControllers } from '../_utils/_controllers';
import { GroupeController } from './groupe.controller';
import { ImageController } from './image.controller';
import { MangaController } from './manga.controller';
import { CompanyController } from './company.controller';
import { PersonController } from './person.controller';
import { CharacterController } from './character.controller';
import { TrackController } from './track.controller';
import LogSession from '../_utils/_logSession';
import { DevLog } from '../_lib/logger';
import { genPublicID } from '@actunime/utils';
import { Anime } from '../_lib/media/_anime';
import { Patch } from '../_lib/media';

class AnimeController extends UtilControllers.withBasic {
  private groupeController: GroupeController;
  private imageController: ImageController;
  private mangaController: MangaController;
  private companyController: CompanyController;
  private personController: PersonController;
  private characterController: CharacterController;
  private trackController: TrackController;

  private targetPath: ITargetPath = 'Anime';
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
    this.mangaController = new MangaController(session, options);
    this.companyController = new CompanyController(session, options);
    this.personController = new PersonController(session, options);
    this.characterController = new CharacterController(session, options);
    this.trackController = new TrackController(session, options);
  }

  async build(
    input: IAnimeCreateBody['data'],
    params: { refId: string; isRequest: boolean; animeId?: string }
  ) {
    const {
      groupe,
      parent,
      cover,
      banner,
      manga,
      companys,
      staffs,
      characters,
      tracks,
      ...rawAnime
    } = input;
    const { refId, isRequest, animeId } = params;
    const session = this.session;
    this.needSession(session);

    const anime: Partial<IAnime> & Required<{ id: string }> = {
      ...rawAnime,
      id: params.animeId || genPublicID(8),
      isVerified: false,
    };
    let patchs: IPatch[] = [];

    if (animeId) {
      // Vérification que l'anime existe;
      const getAnime = await Anime.get(animeId, {
        cache: '5s',
        nullThrowErr: true,
      });
      // Valeur a synchroniser;
      anime.isVerified = getAnime.isVerified;
    }

    DevLog(`Build anime... ID: ${anime.id}`, 'debug');

    const groupeData = await this.groupeController.add(
      groupe,
      refId,
      isRequest
    );
    if (groupeData?.patch) patchs.push(groupeData.patch);
    if (groupeData) anime.groupe = { id: groupeData.id };

    const animeData = await this.add(parent);
    anime.parent = animeData;

    const mangaData = await this.mangaController.add(manga);
    anime.manga = mangaData;

    const companyData = await this.companyController.bulkAdd(
      companys,
      refId,
      isRequest
    );
    if (companyData?.patchs) patchs = patchs.concat(companyData.patchs);
    anime.companys = companyData?.items;

    const coverData = await this.imageController.add(
      cover,
      refId,
      isRequest,
      { id: anime.id },
      this.targetPath
    );

    if (coverData?.patch) patchs.push(coverData.patch);
    if (coverData) anime.cover = { id: coverData.id };

    const bannerData = await this.imageController.add(
      banner,
      refId,
      isRequest,
      { id: anime.id },
      this.targetPath
    );

    if (bannerData?.patch) patchs.push(bannerData.patch);
    if (bannerData) anime.banner = { id: bannerData.id };

    const staffData = await this.personController.bulkAdd(
      staffs,
      refId,
      isRequest
    );

    if (staffData?.patchs) patchs = patchs.concat(staffData.patchs);
    anime.staffs = staffData?.items;

    const characterData = await this.characterController.bulkAdd(
      characters,
      refId,
      isRequest
    );

    if (characterData?.patchs) patchs = patchs.concat(characterData.patchs);
    anime.characters = characterData?.items;

    const trackData = await this.trackController.bulkAdd(
      tracks,
      refId,
      isRequest
    );

    if (trackData?.patchs) patchs = patchs.concat(trackData.patchs);
    anime.tracks = trackData?.items;

    return {
      build: new Anime(anime, this.session),
      patchs,
    };
  }
  public async add(item: IAnimeAddBody | undefined) {
    const session = this.session;
    if (item?.id) {
      const get = await Anime.get(item.id, {
        nullThrowErr: true,
        session,
      });
      return { id: get.id };
    } else if (item)
      throw new APIError('Vous devez fournir un anime valide', 'BAD_REQUEST');
    return;
  }

  public async bulkAdd(mangas: IAnimeAddBody[] | undefined) {
    if (!mangas?.length) return undefined;
    const items = await Promise.all(
      mangas.map(async (manga) => this.add(manga))
    );

    return {
      items: items,
    };
  }

  public async create(
    data: IAnimeCreateBody['data'],
    params: Omit<IAnimeCreateBody, 'data'>
  ) {
    DevLog("Création de l'anime...", 'debug');
    this.needSession(this.session);
    const refId = genPublicID(8);
    const { build } = await this.build(data, { refId, isRequest: false });
    build.setUnverified();

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

    this.log?.add("Création d'un anime", [
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

    DevLog(`Anime créé... ID Anime: ${saved.id}, ID Maj: ${refId}`, 'debug');
    return {
      data: saved,
      patch: newPatch.toJSON(),
    };
  }

  public async update(
    id: string,
    data: IAnimeCreateBody['data'],
    params: Omit<IAnimeCreateBody, 'data'>
  ) {
    DevLog("Mise à jour de l'anime...", 'debug');
    this.needSession(this.session);
    const patchID = genPublicID(8);
    const { build } = await this.build(data, {
      refId: patchID,
      isRequest: false,
      animeId: id,
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

    this.log?.add("Modification d'un anime", [
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
      `Anime mis à jour, ID Anime: ${build.id}, ID Maj: ${patchID}`,
      'debug'
    );

    return {
      data: updated,
      patch: newPatch.toJSON(),
    };
  }

  public async delete(id: string, params: IMediaDeleteBody) {
    DevLog("Suppression de l'anime...", 'debug');
    this.needSession(this.session);
    const media = await Anime.get(id, {
      json: false,
      nullThrowErr: true,
      session: this.session,
    });
    const deleted = await media.delete({ nullThrowErr: true });
    const patchID = genPublicID(8);

    if (media.isVerified) {
      // Créez un patch que si l'anime était un anime vérifié;
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

      this.log?.add("Suppresion d'un anime", [
        { name: 'Nom', content: media.title.default },
        { name: 'ID', content: media.id },
        { name: 'Raison', content: params.reason },
        {
          name: 'Modérateur',
          content: `${this.user.username} (${this.user.id})`,
        },
      ]);

      DevLog(
        `Anime supprimé, ID Anime: ${media.id}, ID Maj: ${patchID}`,
        'debug'
      );
      return {
        data: deleted,
        patch: newPatch.toJSON(),
      };
    }

    DevLog(
      `Anime non supprimé ou inexistant ou bug ???, ID Anime: ${media.id}`,
      'debug'
    );
    return {
      data: deleted,
    };
  }

  public async verify(id: string) {
    DevLog("Verification de l'anime...", 'debug');
    const media = await Anime.get(id, {
      json: false,
      nullThrowErr: true,
      session: this.session,
    });
    const patch = await Patch.get(
      {
        target: media.asRelation(),
        targetPath: this.targetPath,
        type: 'CREATE',
        status: 'PENDING',
      },
      { session: this.session }
    );
    if (patch)
      throw new APIError(
        'Avant de vérifier cette anime, vous devez accepter la requête qui est lié a sa création',
        'FORBIDDEN'
      );
    await media.setVerified(true);
    DevLog(`Anime verifié, ID Anime: ${media.id}`, 'debug');
    return media.toJSON();
  }

  public async unverify(id: string) {
    DevLog("Verification de l'anime...", 'debug');
    const media = await Anime.get(id, {
      json: false,
      nullThrowErr: true,
      session: this.session,
    });
    await media.setUnverified(true);
    DevLog(`Anime non verifié, ID Anime: ${media.id}`, 'debug');
    return media.toJSON();
  }

  public async create_request(
    data: IAnimeCreateBody['data'],
    params: Omit<IAnimeCreateBody, 'data'>
  ) {
    DevLog("Demande de création d'un anime...", 'debug');
    const refId = genPublicID(8);
    const { build } = await this.build(data, { refId, isRequest: true });
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

    this.log?.add("Demande de création d'un anime", [
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
      `Anime créé, Demande crée... ID Anime: ${build.id}, ID Demande: ${refId}`,
      'debug'
    );
    return {
      data: build.toJSON(),
      patch: newPatch.toJSON(),
    };
  }

  public async update_request(
    id: string,
    data: IAnimeCreateBody['data'],
    params: Omit<IAnimeCreateBody, 'data'>
  ) {
    DevLog("Demande de modification d'un anime...", 'debug');
    const refId = genPublicID(8);
    const { build } = await this.build(data, {
      refId,
      isRequest: true,
      animeId: id,
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

    this.log?.add("Demande de modification d'un anime", [
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
      `Demande crée, ID Anime: ${build.id}, ID Demande: ${refId}`,
      'debug'
    );
    return {
      data: build.toJSON(),
      patch: newPatch.toJSON(),
    };
  }

  public async update_patch(
    animeID: string,
    patchID: string,
    data: IAnimeCreateBody['data'],
    params: Omit<IAnimeCreateBody, 'data'>
  ) {
    DevLog("Modification d'une demande de modification d'un anime...", 'debug');
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

    if (!request.targetIdIs(animeID))
      throw new APIError(
        "L'identifiant de l'anime n'est pas celui qui est lié a la requête",
        'BAD_REQUEST'
      );

    const { build } = await this.build(data, {
      refId: request.id,
      isRequest: true,
      animeId: animeID,
    });

    const requestPatchAppliedChanges = Patch.getChangedFromDiff(
      build.toJSON(),
      request.changes
    );

    const { changes } = await build.getDBDiff(requestPatchAppliedChanges);
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

    console.log('... SAUVEGARDE');
    const newRequest = await request.update({
      set: { changes: changes, isChangesUpdated: true },
      nullThrowErr: true,
    });

    DevLog(
      `Demande modifiée, ID Anime: ${animeID}, ID Demande: ${newRequest.id}`,
      'debug'
    );

    return {
      data: build.toJSON(),
      patch: newPatch.toJSON(),
    };
  }

  public async accept_patch(
    animeID: string,
    patchID: string
    // params: IMediaVerifyBody
  ) {
    DevLog("Acceptation d'une demande de modification d'un anime...", 'debug');
    const patch = await Patch.get(patchID, {
      nullThrowErr: true,
      json: false,
      session: this.session,
    });

    if (!patch.targetIdIs(animeID))
      throw new APIError(
        "L'identifiant de l'anime n'est pas celui qui est lié a la requête",
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

    const target = await Anime.get(patch.target.id, {
      nullThrowErr: true,
      json: false,
      session: this.session,
    });

    let newData: IAnime;
    if (patch.isCreate()) {
      if (patch.changes) {
        DevLog(
          `Le patch contient des changements qui vont être appliqués`,
          'debug'
        );
        newData = Patch.getChangedFromDiff(target.toJSON(), patch.changes);
        await target.update({ set: newData });
      } else {
        DevLog(`Le patch ne contient aucun nouveau changement |...`, 'debug');
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
    console.log(newData);
    // if (params.reccursive)
    //   await this.patchController.acceptPatchReferences(patch.id, params);

    const newPatch = await patch.update({
      set: { status: 'ACCEPTED' },
      nullThrowErr: true,
    });

    DevLog(
      `Demande acceptée, ID Anime: ${newPatch.target.id}, ID Demande: ${newPatch.id}`,
      'debug'
    );
    return {
      data: newData,
      patch: newPatch,
    };
  }

  public async reject_patch(
    animeID: string,
    patchID: string
    // params: IMediaVerifyBody
  ) {
    DevLog("Refus d'une demande de modification d'un anime...", 'debug');
    this.needSession(this.session);
    const patch = await Patch.get(patchID, {
      nullThrowErr: true,
      json: false,
      session: this.session,
    });

    if (!patch.targetIdIs(animeID))
      throw new APIError(
        "L'identifiant de l'anime n'est pas celui qui est lié a la requête",
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

    const target = await Anime.get(patch.target.id, {
      nullThrowErr: true,
      json: false,
      session: this.session,
    });

    if (patch.type === 'CREATE') {
      // Suppression de l'anime qui a été crée automatiquement dans le cadre de la demande;
      await target.delete({ nullThrowErr: true });
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
      `Demande refusée, ID Anime: ${newPatch.target.id}, ID Demande: ${newPatch.id}`,
      'debug'
    );
    return {
      patch: newPatch,
    };
  }
}

export { AnimeController };
