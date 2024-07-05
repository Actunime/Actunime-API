import { ClientSession, Document } from 'mongoose';
import { AnimeModel } from '@/_models';
import { IAnime } from '../_types/animeType';
import { IUser } from '../_types/userType';
import { IAnime_Pagination_ZOD, ICreate_Anime_ZOD } from '../_validation/animeZOD';
import { PatchManager } from './patch';
import { GroupeManager } from './groupe';
import { CompanyManager } from './company';
import { PersonManager } from './person';
import { CharacterManager } from './character';
import { TrackManager } from './track';
import { IPatchActionList } from '../_types/patchType';
import { getChangedData } from '../_utils/getObjChangeUtil';
import { MediaPagination } from './pagination';
import { IPaginationResponse } from '@/_types/paginationType';

export class AnimeManager {
  private user?: IUser;
  private session: ClientSession;
  private newData!: Partial<IAnime>;

  constructor(session: ClientSession, user?: IUser) {
    this.user = user;
    this.session = session;
  }

  private async populate(
    doc: Document | IPaginationResponse<IAnime>,
    withMedia: IAnime_Pagination_ZOD['with']
  ) {
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

    const response = await pagination.getResults();

    if (paginationInput.with) await this.populate(response, paginationInput.with);

    return response;
  }

  public async init(data: ICreate_Anime_ZOD) {
    const {
      // Relations
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

    // ? Parent
    if (parent && parent.id && (await AnimeModel.exists({ id: parent.id })))
      newData.parent = parent;
    else throw new Error('Parent not found');

    // ? Source
    if (source && source.id && (await AnimeModel.exists({ id: source.id })))
      newData.source = source;
    else throw new Error('Source not found');

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

    return this;
  }

  public async create(note?: string) {
    const newAnime = new AnimeModel(this.newData);
    newAnime.isVerified = true;
    await newAnime.save({ session: this.session });

    const actions: IPatchActionList[] = [{ note, label: 'DIRECT_CREATE', user: this.user! }];

    await new PatchManager(this.session, this.user!).PatchCreate({
      type: 'CREATE',
      status: 'ACCEPTED',
      target: { id: newAnime.id },
      actions,
      targetPath: 'Anime',
      changes: newAnime.toJSON(),
      beforeChanges: null,
      author: { id: this.user!.id }
    });

    return newAnime;
  }

  public async createRequest(note?: string) {
    const newAnime = new AnimeModel(this.newData);

    newAnime.isVerified = false;

    // Pré-disposition d'un anime qui est en cours de création.
    await newAnime.save({ session: this.session });

    const actions: IPatchActionList[] = [{ note, label: 'REQUEST', user: this.user! }];

    await new PatchManager(this.session, this.user!).PatchCreate({
      type: 'CREATE_REQUEST',
      status: 'PENDING',
      target: { id: newAnime.id },
      actions,
      targetPath: 'Anime',
      changes: newAnime.toJSON(),
      beforeChanges: null,
      author: { id: this.user!.id }
    });

    return newAnime;
  }

  public async update(animeID: string, note?: string) {
    const newAnimeData = new AnimeModel(this.newData);

    const animeToUpdate = await AnimeModel.findOne({ id: animeID }, {}, { session: this.session });

    if (!animeToUpdate) throw new Error('Anime not found');

    newAnimeData._id = animeToUpdate._id;
    newAnimeData.id = animeToUpdate.id;

    const changes = await getChangedData(animeToUpdate.toJSON(), newAnimeData, [
      '_id',
      'id',
      'createdAt',
      'updatedAt'
    ]);

    if (!changes) throw new Error('No changes found');

    await animeToUpdate.updateOne({ $set: changes.newValues }, { session: this.session });

    const actions: IPatchActionList[] = [{ note, label: 'DIRECT_PATCH', user: this.user! }];

    await new PatchManager(this.session, this.user!).PatchCreate({
      type: 'UPDATE',
      status: 'ACCEPTED',
      target: { id: newAnimeData.id },
      actions,
      targetPath: 'Anime',
      changes: changes?.newValues,
      beforeChanges: changes?.oldValues,
      author: { id: this.user!.id }
    });

    return newAnimeData;
  }

  public async updateRequest(animeID: string, note?: string) {
    const newAnimeData = new AnimeModel(this.newData);

    const animeToUpdate = await AnimeModel.findOne({ id: animeID }, {}, { session: this.session });

    if (!animeToUpdate) throw new Error('Anime not found');

    newAnimeData._id = animeToUpdate._id;
    newAnimeData.id = animeToUpdate.id;

    const changes = await getChangedData(animeToUpdate.toJSON(), newAnimeData, [
      '_id',
      'id',
      'createdAt',
      'updatedAt'
    ]);

    if (!changes) throw new Error('No changes found');

    await animeToUpdate.updateOne({ $set: changes.newValues }, { session: this.session });

    const actions: IPatchActionList[] = [{ note, label: 'REQUEST', user: this.user! }];

    await new PatchManager(this.session, this.user!).PatchCreate({
      type: 'UPDATE_REQUEST',
      status: 'PENDING',
      target: { id: newAnimeData.id },
      actions,
      targetPath: 'Anime',
      changes: changes?.newValues,
      beforeChanges: changes?.oldValues,
      author: { id: this.user!.id }
    });

    return newAnimeData;
  }
}
