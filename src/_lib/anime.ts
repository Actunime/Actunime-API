import { ClientSession, Document } from 'mongoose';
import { AnimeModel, MangaModel } from '@/_models';
import { IAnime } from '../_types/animeType';
import { IUser } from '../_types/userType';
import { IAnime_Pagination_ZOD, ICreate_Anime_ZOD } from '../_validation/animeZOD';
import { PatchManager } from './patch';
import { GroupeManager } from './groupe';
import { CompanyManager } from './company';
import { PersonManager } from './person';
import { CharacterManager } from './character';
import { TrackManager } from './track';
import { getChangedData } from '../_utils/getObjChangeUtil';
import { MediaPagination } from './pagination';
import { ImageManager } from './image';
import { APIError } from './Error';

export class AnimeManager {
  private user?: IUser;
  private session: ClientSession;
  private newData!: Partial<IAnime>;
  private coverManager?: ImageManager;
  private bannerManager?: ImageManager;

  constructor(session: ClientSession, user?: IUser) {
    this.user = user;
    this.session = session;
  }

  private async populate(doc: Document | IAnime[], withMedia: IAnime_Pagination_ZOD['with']) {
    if (withMedia?.groupe)
      await AnimeModel.populate(doc, {
        path: 'groupe.data',
        select: '-_id',
        justOne: true,
        options: { session: this.session }
      });

    if (withMedia?.parent)
      await AnimeModel.populate(doc, {
        path: 'parent.data',
        select: '-_id',
        justOne: true,
        options: { session: this.session }
      });

    if (withMedia?.source)
      await AnimeModel.populate(doc, {
        path: 'source.data',
        select: '-_id',
        justOne: true,
        options: { session: this.session }
      });

    if (withMedia?.staffs)
      await AnimeModel.populate(doc, {
        path: 'staffs.data',
        select: '-_id',
        justOne: true,
        options: { session: this.session }
      });

    if (withMedia?.companys)
      await AnimeModel.populate(doc, {
        path: 'companys.data',
        select: '-_id',
        justOne: true,
        options: { session: this.session }
      });

    if (withMedia?.characters)
      await AnimeModel.populate(doc, {
        path: 'characters.data',
        select: '-_id',
        justOne: true,
        options: { session: this.session }
      });

    if (withMedia?.tracks)
      await AnimeModel.populate(doc, {
        path: 'tracks.data',
        select: '-_id',
        justOne: true,
        options: { session: this.session }
      });

    if (withMedia?.cover)
      await AnimeModel.populate(doc, {
        path: 'cover.data',
        select: '-_id',
        justOne: true,
        options: { session: this.session }
      });

    console.log('anime', (doc[0] as unknown as IAnime).cover);
  }

  public async get(id: string, withMedia?: IAnime_Pagination_ZOD['with']) {
    const findAnime = await AnimeModel.findOne({ id }, null, { session: this.session }).select(
      '-_id'
    );

    if (!findAnime) throw new Error('Anime not found');
    if (withMedia) await this.populate(findAnime, withMedia);

    return findAnime.toJSON();
  }

  public async filter(paginationInput: IAnime_Pagination_ZOD) {
    const pagination = new MediaPagination({ model: AnimeModel });

    pagination.setPagination({ page: paginationInput.page, limit: paginationInput.limit });

    const query = paginationInput.query;
    const sort = paginationInput.sort;

    if (query?.name) pagination.searchByName(query.name, 'title.default');

    if (paginationInput.strict) {
      pagination.setStrict(paginationInput.strict);
    } else if (query?.name)
      // Si c'est pas en strict chercher aussi dans les alias
      pagination.searchByName(query.name, 'title.alias');
    // Le strict risque de faire que les noms doivent correspondre tout les deux a la recherche

    if (sort) pagination.setSort(sort);

    pagination.addSearchQuery([
      ...(query?.status ? [{ status: query.status }] : []),
      ...(query?.genres && query.genres.length ? [{ genres: { $in: query.genres } }] : [])
    ]);
    console.log(pagination.searchQuery);
    const response = await pagination.getResults();

    if (paginationInput.with) await this.populate(response.results, paginationInput.with);

    return response;
  }

  public async init(data: ICreate_Anime_ZOD) {
    try {
      const {
        // Relations
        cover,
        banner,
        groupe,
        parent,
        source,
        companys,
        staffs,
        characters,
        tracks,
        // Data
        ...rawData
      } = data;

      this.newData = rawData as Partial<IAnime>;

      const { newData, user, session } = this;

      // ? Groupe
      if (groupe) newData.groupe = await new GroupeManager(session, user).createRelation(groupe);

      if (parent) {
        if (!newData.parent) newData.parent = {};

        if (parent.id)
          if (await AnimeModel.exists({ id: parent.id })) newData.parent['id'] = parent.id;
          else throw new Error('parent not found');

        if (parent.parentLabel) newData.parent['parentLabel'] = parent.parentLabel;
      }

      // ? Source
      if (source) {
        if (!newData.source) newData.source = {};

        if (source.id)
          if (await MangaModel.exists({ id: source.id })) newData.source['id'] = source.id;
          else throw new Error('Source not found');

        if (source.sourceLabel) newData.source['sourceLabel'] = source.sourceLabel;
      }

      if (companys)
        newData.companys = await new CompanyManager(session, user).createMultipleRelation(companys);

      if (staffs)
        newData.staffs = await new PersonManager(session, user).createMultipleRelation(staffs);

      if (characters)
        newData.characters = await new CharacterManager(session, user).createMultipleRelation(
          characters
        );

      if (tracks)
        newData.tracks = await new TrackManager(session, user).createMultipleRelation(tracks);

      if (cover) {
        this.coverManager = new ImageManager(session, 'Anime', user);
        newData.cover = await this.coverManager.createRelation(cover);
      }

      if (banner) {
        this.bannerManager = new ImageManager(session, 'Anime', user);
        newData.banner = await this.bannerManager.createRelation(banner);
      }

      return this;
    } catch (err) {
      await this.coverManager?.deleteImageIfSaved();
      await this.bannerManager?.deleteImageIfSaved();
      throw err;
    }
  }

  public async create(note?: string) {
    const newAnime = new AnimeModel(this.newData);
    try {
      newAnime.isVerified = true;
      await newAnime.save({ session: this.session });

      await new PatchManager(this.session, this.user!).PatchCreate({
        type: 'CREATE',
        status: 'ACCEPTED',
        target: { id: newAnime.id },
        note,
        targetPath: 'Anime',
        newValues: newAnime.toJSON(),
        oldValues: null,
        author: { id: this.user!.id }
      });

      return newAnime;
    } catch (err) {
      await this.coverManager?.deleteImageIfSaved();
      await this.bannerManager?.deleteImageIfSaved();
      throw err;
    }
  }

  public async createRequest(note?: string) {
    const newAnime = new AnimeModel(this.newData);
    try {
      newAnime.isVerified = false;

      // Pré-disposition d'un anime qui est en cours de création.
      await newAnime.save({ session: this.session });

      await new PatchManager(this.session, this.user!).PatchCreate({
        type: 'CREATE_REQUEST',
        status: 'PENDING',
        target: { id: newAnime.id },
        targetPath: 'Anime',
        newValues: newAnime.toJSON(),
        oldValues: null,
        author: { id: this.user!.id }
      });

      return newAnime;
    } catch (err) {
      await this.coverManager?.deleteImageIfSaved();
      await this.bannerManager?.deleteImageIfSaved();
      throw err;
    }
  }

  public async update(animeID: string, note?: string) {
    const newAnimeData = new AnimeModel(this.newData);
    try {
      const animeToUpdate = await AnimeModel.findOne(
        { id: animeID },
        {},
        { session: this.session }
      );
      if (!animeToUpdate)
        throw new APIError('Aucun anime correspondent a cet identifiant', 'NOT_FOUND', 404);

      newAnimeData._id = animeToUpdate._id;
      newAnimeData.id = animeToUpdate.id;

      const changes = getChangedData(animeToUpdate.toJSON(), newAnimeData, [
        '_id',
        'id',
        'createdAt',
        'updatedAt'
      ]);

      if (!changes) throw new APIError("Aucun changement n'a été détecté", 'EMPTY_CHANGES', 400);

      await animeToUpdate.updateOne({ $set: changes.newValues }, { session: this.session });

      await new PatchManager(this.session, this.user!).PatchCreate({
        type: 'UPDATE',
        status: 'ACCEPTED',
        target: { id: newAnimeData.id },
        targetPath: 'Anime',
        newValues: changes?.newValues,
        oldValues: changes?.oldValues,
        author: { id: this.user!.id }
      });

      if (this.coverManager?.hasNewImage())
        await this.coverManager.deleteImageFile(animeToUpdate.cover?.id);

      if (this.bannerManager?.hasNewImage())
        await this.bannerManager.deleteImageFile(animeToUpdate.banner?.id);

      return newAnimeData;
    } catch (err) {
      await this.coverManager?.deleteImageIfSaved();
      await this.bannerManager?.deleteImageIfSaved();
      throw err;
    }
  }

  public async updateRequest(animeID: string, note?: string) {
    const newAnimeData = new AnimeModel(this.newData);
    try {
      const animeToUpdate = await AnimeModel.findOne(
        { id: animeID },
        {},
        { session: this.session }
      );

      if (!animeToUpdate) throw new APIError('Aucun anime correspondant', 'NOT_FOUND', 404);

      newAnimeData._id = animeToUpdate._id;
      newAnimeData.id = animeToUpdate.id;

      const changes = getChangedData(animeToUpdate.toJSON(), newAnimeData, [
        '_id',
        'id',
        'createdAt',
        'updatedAt'
      ]);

      if (!changes) throw new APIError("Aucun changement n'a été détecté", 'EMPTY_CHANGES', 400);

      await animeToUpdate.updateOne({ $set: changes.newValues }, { session: this.session });

      await new PatchManager(this.session, this.user!).PatchCreate({
        type: 'UPDATE_REQUEST',
        status: 'PENDING',
        target: { id: newAnimeData.id },
        targetPath: 'Anime',
        newValues: changes?.newValues,
        oldValues: changes?.oldValues,
        author: { id: this.user!.id }
      });

      return newAnimeData;
    } catch (err) {
      await this.coverManager?.deleteImageIfSaved();
      await this.bannerManager?.deleteImageIfSaved();
      throw err;
    }
  }
}
