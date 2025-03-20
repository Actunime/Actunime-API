import { ClientSession } from 'mongoose';
import { APIError } from '../_lib/Error';
import {
  IAnime,
  IAnimePaginationResponse,
  ITargetPath,
  IUser,
} from '@actunime/types';
import { PaginationControllers } from './pagination.controllers';
import {
  IAnimeCreateBody,
  IAnimePaginationBody,
  IMediaDeleteBody,
  IMediaVerifyBody,
} from '@actunime/validations';
import { UtilControllers } from '../_utils/_controllers';
import { PatchController, PatchDiff } from './patch.controllers';
import DeepDiff from 'deep-diff';
import { GroupeController } from './groupe.controller';
import { ImageController } from './image.controller';
import { MangaController } from './manga.controller';
import { CompanyController } from './company.controller';
import { PersonController } from './person.controler';
import { CharacterController } from './character.controller';
import { TrackController } from './track.controller';
import LogSession from '../_utils/_logSession';
import { DevLog } from '../_lib/logger';
import { genPublicID } from '@actunime/utils';
import { Anime } from '../_lib/anime';
import { AnimeModel } from '../_lib/models';

class AnimeController extends UtilControllers.withUser {
  private patchController: PatchController;
  private targetPath: ITargetPath = 'Anime';
  private groupeController: GroupeController;
  private imageController: ImageController;
  private mangaController: MangaController;
  private companyController: CompanyController;
  private personController: PersonController;
  private characterController: CharacterController;
  private trackController: TrackController;

  constructor(
    session: ClientSession | null = null,
    options?: { log?: LogSession; user?: IUser }
  ) {
    super({ session, ...options });
    this.patchController = new PatchController(session, options);
    this.groupeController = new GroupeController(session, options);
    this.imageController = new ImageController(session, options);
    this.mangaController = new MangaController(session, options);
    this.companyController = new CompanyController(session, options);
    this.personController = new PersonController(session, options);
    this.characterController = new CharacterController(session, options);
    this.trackController = new TrackController(session, options);
  }

  async pagination(
    pageFilter?: Partial<IAnimePaginationBody>
  ): Promise<IAnimePaginationResponse<IAnime>> {
    DevLog(`Pagination des animes...`, 'debug');
    const pagination = new PaginationControllers(AnimeModel);

    pagination.useFilter(pageFilter);

    const res = await pagination.getResults();
    res.results = res.results.map((result) => new Anime(result).toJSON());

    DevLog(`Animes trouvées: ${res.resultsCount}`, 'debug');
    return res;
  }

  async build(
    input: IAnimeCreateBody['data'],
    params: { refId: string; isRequest: boolean; animeId?: string }
  ): Promise<Anime> {
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

    const anime: Partial<IAnime> = {
      ...rawAnime,
      id: params.animeId || genPublicID(8),
      isVerified: false,
    };

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

    if (groupe && (groupe.id || groupe.newGroupe)) {
      DevLog(
        `Ajout du groupe a l'anime... ${
          groupe.id
            ? `ID: ${groupe.id}`
            : `Nouveau groupe: ${JSON.stringify(groupe.newGroupe)}`
        }`,
        'debug'
      );
      const getGroupe = groupe.id
        ? await this.groupeController.getById(groupe.id)
        : isRequest
        ? await this.groupeController.create_request(groupe.newGroupe!, {
            refId,
          })
        : await this.groupeController.create(groupe.newGroupe!, { refId });
      DevLog(`Groupe ajouté... ID: ${getGroupe.id}`, 'debug');
      anime.groupe = { id: getGroupe.id };
    }

    if (parent && parent.id) {
      DevLog(`Ajout du parent a l'anime... ID: ${parent.id}`, 'debug');
      const getParent = await Anime.get(parent.id, {
        nullThrowErr: true,
        session,
      });
      DevLog(`Parent ajouté... ID: ${getParent.id}`, 'debug');
      anime.parent = { id: getParent.id };
    }

    if (cover || banner) {
      if (cover && (cover.id || cover.newImage)) {
        DevLog(
          `Ajout de la couverture a l'anime... ${
            cover.id
              ? `ID: ${cover.id}`
              : `Nouvelle couverture: ${JSON.stringify(cover.newImage)}`
          }`,
          'debug'
        );
        const getImage = cover.id
          ? await this.imageController.getById(cover.id)
          : isRequest
          ? await this.imageController.create_request(cover.newImage!, {
              refId,
              target: { id: anime.id! },
              targetPath: this.targetPath,
            })
          : await this.imageController.create(cover.newImage!, {
              refId,
              target: { id: anime.id! },
              targetPath: this.targetPath,
            });
        DevLog(`Couverture ajouté... ID: ${getImage.id}`, 'debug');
        anime.cover = { id: getImage.id };
      }

      if (banner && (banner.id || banner.newImage)) {
        DevLog(
          `Ajout de la bannière a l'anime... ${
            banner.id
              ? `ID: ${banner.id}`
              : `Nouvelle bannière: ${JSON.stringify(banner.newImage)}`
          }`,
          'debug'
        );
        const getImage = banner.id
          ? await this.imageController.getById(banner.id)
          : isRequest
          ? await this.imageController.create_request(banner.newImage!, {
              refId,
              target: { id: anime.id! },
              targetPath: this.targetPath,
            })
          : await this.imageController.create(banner.newImage!, {
              refId,
              target: { id: anime.id! },
              targetPath: this.targetPath,
            });
        DevLog(`Bannière ajouté... ID: ${getImage.id}`, 'debug');
        anime.banner = { id: getImage.id };
      }
    }

    if (manga && manga.id) {
      DevLog(`Ajout du manga a l'anime... ID: ${manga.id}`, 'debug');
      const getManga = await this.mangaController.getById(manga.id);
      DevLog(`Manga ajouté... ID: ${getManga.id}`, 'debug');
      anime.manga = { id: getManga.id };
    }

    if (companys && companys.length > 0) {
      const getActors = await Promise.all(
        companys.map(async (company) => {
          if (company && (company.id || company.newCompany)) {
            DevLog(
              `Ajout de la société a l'anime... ${
                company.id
                  ? `ID: ${company.id}`
                  : `Nouvelle société: ${JSON.stringify(company.newCompany)}`
              }`,
              'debug'
            );
            const getCompany = company.id
              ? await this.companyController.getById(company.id)
              : isRequest
              ? await this.companyController.create_request(
                  company.newCompany!,
                  { refId }
                )
              : await this.companyController.create(company.newCompany!, {
                  refId,
                });
            DevLog(`Société ajouté... ID: ${getCompany.id}`, 'debug');
            return { id: getCompany.id };
          }
        })
      );
      anime.companys = getActors.filter(
        (company) => company
      ) as typeof anime.companys;
    }

    if (staffs && staffs.length > 0) {
      const getActors = await Promise.all(
        staffs.map(async (staff) => {
          if (staff && (staff.id || staff.newPerson)) {
            DevLog(
              `Ajout du staff a l'anime... ${
                staff.id
                  ? `ID: ${staff.id}`
                  : `Nouveau staff: ${JSON.stringify(staff.newPerson)}`
              }`,
              'debug'
            );
            const getStaff = staff.id
              ? await this.personController.getById(staff.id)
              : isRequest
              ? await this.personController.create_request(staff.newPerson!, {
                  refId,
                })
              : await this.personController.create(staff.newPerson!, { refId });
            DevLog(`Staff ajouté... ID: ${getStaff.id}`, 'debug');
            return { id: getStaff.id, role: staff.role };
          }
        })
      );
      anime.staffs = getActors.filter((staff) => staff) as typeof anime.staffs;
    }

    if (characters && characters.length > 0) {
      const getActors = await Promise.all(
        characters.map(async (character) => {
          if (character && (character.id || character.newCharacter)) {
            DevLog(
              `Ajout du personnage a l'anime... ${
                character.id
                  ? `ID: ${character.id}`
                  : `Nouveau personnage: ${JSON.stringify(
                      character.newCharacter
                    )}`
              }`,
              'debug'
            );
            const getCharacter = character.id
              ? await this.characterController.getById(character.id)
              : isRequest
              ? await this.characterController.create_request(
                  character.newCharacter!,
                  { refId }
                )
              : await this.characterController.create(character.newCharacter!, {
                  refId,
                });
            DevLog(`Personnage ajouté... ID: ${getCharacter.id}`, 'debug');
            return { id: getCharacter.id, role: character.role };
          }
        })
      );
      anime.characters = getActors.filter(
        (character) => character
      ) as typeof anime.characters;
    }

    if (tracks && tracks.length > 0) {
      const getActors = await Promise.all(
        tracks.map(async (track) => {
          if (track && (track.id || track.newTrack)) {
            DevLog(
              `Ajout du track a l'anime... ${
                track.id
                  ? `ID: ${track.id}`
                  : `Nouveau track: ${JSON.stringify(track.newTrack)}`
              }`,
              'debug'
            );
            const getTrack = track.id
              ? await this.trackController.getById(track.id)
              : isRequest
              ? await this.trackController.create_request(track.newTrack!, {
                  refId,
                })
              : await this.trackController.create(track.newTrack!, { refId });
            DevLog(`Track ajouté... ID: ${getTrack.id}`, 'debug');
            return { id: getTrack.id };
          }
        })
      );
      anime.tracks = getActors.filter((track) => track) as typeof anime.tracks;
    }

    return new Anime(anime, this.session);
  }

  public async create(
    data: IAnimeCreateBody['data'],
    params: Omit<IAnimeCreateBody, 'data'>
  ) {
    DevLog("Création de l'anime...", 'debug');
    this.needUser(this.user);
    this.needSession(this.session);
    const refId = genPublicID(8);
    const build = await this.build(data, { refId, isRequest: false });
    build.setVerified();

    await this.patchController.create({
      id: refId,
      type: 'CREATE',
      author: { id: this.user.id },
      target: build.asRelation(),
      targetPath: this.targetPath,
      original: build.toJSON(),
      status: 'ACCEPTED',
      description: params.description,
      moderator: { id: this.user.id },
    });

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
    return saved;
  }

  public async update(
    id: string,
    data: IAnimeCreateBody['data'],
    params: Omit<IAnimeCreateBody, 'data'>
  ) {
    DevLog("Mise à jour de l'anime...", 'debug');
    this.needUser(this.user);
    this.needSession(this.session);
    const patchID = genPublicID(8);
    const build = await this.build(data, {
      refId: patchID,
      isRequest: false,
      animeId: id,
    });
    const { original, changes } = await build.getDBDiff();

    console.log('changements', changes);

    if (!changes || (changes && !changes.length))
      throw new APIError("Aucun changement n'a été détecté !", 'EMPTY_CHANGES');

    await this.patchController.create({
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
    });

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

    return updated;
  }

  public async delete(id: string, params: IMediaDeleteBody) {
    DevLog("Suppression de l'anime...", 'debug');
    this.needUser(this.user);
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
      await this.patchController.create({
        id: patchID,
        type: 'DELETE',
        author: { id: this.user.id },
        target: { id: media.id },
        targetPath: this.targetPath,
        original: media.toJSON(),
        status: 'ACCEPTED',
        reason: params.reason,
        moderator: { id: this.user.id },
      });
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
    }

    DevLog(
      `Anime non supprimé ou inexistant ou bug ???, ID Anime: ${media.id}`,
      'debug'
    );
    return deleted;
  }

  public async verify(id: string) {
    DevLog("Verification de l'anime...", 'debug');
    const media = await Anime.get(id, {
      json: false,
      nullThrowErr: true,
      session: this.session,
    });
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
    this.needUser(this.user);
    const refId = genPublicID(8);
    const build = await this.build(data, { refId, isRequest: true });
    build.setUnverified();

    await this.patchController.create({
      id: refId,
      type: 'CREATE',
      author: { id: this.user.id },
      target: build.asRelation(),
      targetPath: this.targetPath,
      original: build.toJSON(),
      status: 'PENDING',
      description: params.description,
    });

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
    return build.toJSON();
  }

  public async update_request(
    id: string,
    data: IAnimeCreateBody['data'],
    params: Omit<IAnimeCreateBody, 'data'>
  ) {
    DevLog("Demande de modification d'un anime...", 'debug');
    this.needUser(this.user);
    const refId = genPublicID(8);
    const build = await this.build(data, {
      refId,
      isRequest: true,
      animeId: id,
    });
    const { original, changes } = await build.getDBDiff();
    console.log('changements', changes);

    if (!changes || (changes && !changes.length))
      throw new APIError("Aucun changement n'a été détecté !", 'EMPTY_CHANGES');

    await this.patchController.create({
      id: refId,
      type: 'UPDATE',
      author: { id: this.user.id },
      target: { id: build.id },
      targetPath: this.targetPath,
      original,
      changes,
      status: 'PENDING',
      description: params.description,
    });

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
    return build.toJSON();
  }

  public async update_patch(
    animeID: string,
    patchID: string,
    data: IAnimeCreateBody['data'],
    params: Omit<IAnimeCreateBody, 'data'>
  ) {
    DevLog("Modification d'une demande de modification d'un anime...", 'debug');
    this.needUser(this.user);
    const request = await this.patchController.getById(patchID);
    if (request.status !== 'PENDING')
      throw new APIError(
        'Vous pouvez modifier que les demandes en attente',
        'BAD_REQUEST'
      );

    if (request.target.id !== animeID)
      throw new APIError(
        "L'identifiant de l'anime n'est pas celui qui est lié a la requête",
        'BAD_REQUEST'
      );

    const newPatchData = await this.build(data, {
      refId: request.id,
      isRequest: true,
      animeId: animeID,
    });

    // Changement que provoque la requête original;
    const changement = this.patchController.getModifiedFromDifferences<IAnime>(
      request.original,
      request.changes
    );
    const changes = DeepDiff.diff(
      changement,
      newPatchData.toJSON()
    ) as PatchDiff<IAnime>[];
    // Création du PATCH de modification pour un suivi en status ACCEPTED pour un suivi;
    await this.patchController.create({
      type: 'UPDATE',
      author: { id: this.user.id },
      moderator: { id: this.user.id },
      target: { id: request.id },
      targetPath: 'Patch',
      original: changement,
      changes,
      status: 'ACCEPTED',
      description: params.description,
    });

    const newRequest = await request
      .updateOne({ changes }, { new: true })
      .session(this.session);

    DevLog(
      `Demande modifiée, ID Anime: ${newRequest.target.id}, ID Demande: ${newRequest.id}`,
      'debug'
    );
    return newRequest.toJSON();
  }

  public async delete_patch(
    animeID: string,
    patchID: string,
    params: IMediaDeleteBody
  ) {
    DevLog("Suppression d'une demande de modification d'un anime...", 'debug');
    this.needUser(this.user);
    const request = await this.patchController.getById(patchID);

    if (request.target.id !== animeID)
      throw new APIError(
        "L'identifiant de l'anime n'est pas celui qui est lié a la requête",
        'BAD_REQUEST'
      );

    const deleted = await request.delete(params);

    // Gérer le reccursive
    // if (params.deleteTarget)
    //     await this.delete(request.target.id, params, ["ANIME_REQUEST_DELETE"]);

    DevLog(
      `Demande supprimée (${deleted}), ID Anime: ${request.target.id}, ID Demande: ${request.id}`,
      'debug'
    );
    return deleted;
  }

  public async accept_patch(
    animeID: string,
    patchID: string,
    params: IMediaVerifyBody
  ) {
    DevLog("Acceptation d'une demande de modification d'un anime...", 'debug');
    this.needUser(this.user);
    const patch = await this.patchController.getById(patchID);

    if (patch.target.id !== animeID)
      throw new APIError(
        "L'identifiant de l'anime n'est pas celui qui est lié a la requête",
        'BAD_REQUEST'
      );

    if (patch.status !== 'PENDING')
      throw new APIError(
        'Vous ne pouvez pas accepter cette requête',
        'FORBIDDEN'
      );

    if (!['CREATE', 'UPDATE'].includes(patch.type))
      throw new APIError(
        'Vous ne pouvez pas accepter cette requête',
        'FORBIDDEN'
      );

    // const target = await Anime.get(patch.target.id, { nullThrowErr: true, json: false });

    if (patch.changes) {
      const newData = new Anime(
        this.patchController.getModifiedFromDifferences<any>(
          patch.original,
          patch.changes
        ),
        this.session
      );
      await newData.update({ nullThrowErr: true, upsert: true });
    } else {
      const newData = new Anime(patch.original as IAnime);
      await newData.save();
    }

    if (params.reccursive)
      await this.patchController.acceptPatchReferences(patch.id, params);

    const newPatch = await patch
      .updateOne({ status: 'ACCEPTED' }, { new: true })
      .session(this.session);

    DevLog(
      `Demande acceptée, ID Anime: ${newPatch.target.id}, ID Demande: ${newPatch.id}`,
      'debug'
    );
    return newPatch;
  }
  public async reject_patch(
    animeID: string,
    patchID: string,
    params: IMediaVerifyBody
  ) {
    DevLog("Refus d'une demande de modification d'un anime...", 'debug');
    this.needUser(this.user);
    this.needSession(this.session);
    const patch = await this.patchController.getById(patchID);

    if (patch.target.id !== animeID)
      throw new APIError(
        "L'identifiant de l'anime n'est pas celui qui est lié a la requête",
        'BAD_REQUEST'
      );

    if (patch.status !== 'PENDING')
      throw new APIError(
        'Vous ne pouvez pas accepter cette requête',
        'FORBIDDEN'
      );

    if (!['CREATE', 'UPDATE'].includes(patch.type))
      throw new APIError(
        'Vous ne pouvez pas accepter cette requête',
        'FORBIDDEN'
      );

    const target = await Anime.get(patch.target.id, {
      nullThrowErr: true,
      json: false,
    });

    if (patch.type === 'CREATE') {
      // Suppression de l'anime qui a été crée automatiquement dans le cadre de la demande;
      await target.delete({ nullThrowErr: true, session: this.session });
    }

    // Gérer le reccursive
    // if (params.reccursive)
    //     await this.patchController.acceptPatchReferences(patch.id, params);

    const newPatch = await patch
      .updateOne({ status: 'REJECTED' }, { new: true })
      .session(this.session);

    DevLog(
      `Demande refusée, ID Anime: ${newPatch.target.id}, ID Demande: ${newPatch.id}`,
      'debug'
    );
    return newPatch;
  }

  private async hasPendingPatch(id: string) {
    const res = await Anime.get(id, { nullThrowErr: true });
    const patchs = await this.patchController.fitlerPatchFrom(
      'Anime',
      res.id,
      'PENDING'
    );
    return patchs.length > 0;
  }
}

export { AnimeController };
