import { ClientSession, Document } from 'mongoose';
import { MangaModel } from '../_models';
import { IManga } from '../_types/mangaType';
import { IUser } from '../_types/userType';
import { ICreate_Manga_ZOD, IManga_Pagination_ZOD } from '../_validation/mangaZOD';
import { PatchManager } from './patch';
import { GroupeManager } from './groupe';
import { CompanyManager } from './company';
import { PersonManager } from './person';
import { CharacterManager } from './character';

import { getChangedData } from '../_utils/getObjChangeUtil';
import { IPaginationResponse } from '@/_types/paginationType';
import { MediaPagination } from './pagination';

export class MangaManager {
  private user?: IUser;
  private session: ClientSession;
  private newData!: Partial<IManga>;

  constructor(session: ClientSession, user?: IUser) {
    this.user = user;
    this.session = session;
  }

  private async populate(
    doc: Document | IPaginationResponse<IManga>,
    withMedia: IManga_Pagination_ZOD['with']
  ) {
    if (withMedia?.groupe)
      await MangaModel.populate(doc, {
        path: 'groupe.data',
        select: '-_id',
        justOne: true,
        options: { session: this.session }
      });

    if (withMedia?.parent)
      await MangaModel.populate(doc, {
        path: 'parent.data',
        select: '-_id',
        justOne: true,
        options: { session: this.session }
      });

    if (withMedia?.source)
      await MangaModel.populate(doc, {
        path: 'source.data',
        select: '-_id',
        justOne: true,
        options: { session: this.session }
      });

    if (withMedia?.staffs)
      await MangaModel.populate(doc, {
        path: 'staffs.data',
        select: '-_id',
        justOne: true,
        options: { session: this.session }
      });

    if (withMedia?.companys)
      await MangaModel.populate(doc, {
        path: 'companys.data',
        select: '-_id',
        justOne: true,
        options: { session: this.session }
      });

    if (withMedia?.characters)
      await MangaModel.populate(doc, {
        path: 'characters.data',
        select: '-_id',
        justOne: true,
        options: { session: this.session }
      });
  }

  public async get(id: string, withMedia?: IManga_Pagination_ZOD['with']) {
    const findManga = await MangaModel.findOne({ id }, null, { session: this.session }).select(
      '-_id'
    );

    if (!findManga) throw new Error('Manga not found');

    if (withMedia) await this.populate(findManga, withMedia);

    return findManga.toJSON();
  }

  public async filter(paginationInput: IManga_Pagination_ZOD) {
    const pagination = new MediaPagination({ model: MangaModel });

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

  public async init(data: ICreate_Manga_ZOD) {
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

    this.newData = rawData as Partial<IManga>;

    const { newData, user, session } = this;

    // ? Groupe
    if (groupe) newData.groupe = await new GroupeManager(session, user).createRelation(groupe);

    // ? Parent
    if (parent && parent.id && (await MangaModel.exists({ id: parent.id })))
      newData.parent = parent;
    else throw new Error('Parent not found');

    // ? Source
    if (source && source.id && (await MangaModel.exists({ id: source.id })))
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

    return this;
  }

  public async create(note?: string) {
    const newManga = new MangaModel(this.newData);
    newManga.isVerified = true;
    await newManga.save({ session: this.session });



    await new PatchManager(this.session, this.user!).PatchCreate({
      type: 'CREATE',
      status: 'ACCEPTED',
      target: { id: newManga.id },
      note,
      targetPath: 'Manga',
      newValues: newManga.toJSON(),
      oldValues: null,
      author: { id: this.user!.id }
    });

    return newManga;
  }

  public async createRequest(note?: string) {
    const newManga = new MangaModel(this.newData);

    newManga.isVerified = false;

    // Pré-disposition d'un manga qui est en cours de création.
    await newManga.save({ session: this.session });


    await new PatchManager(this.session, this.user!).PatchCreate({
      type: 'CREATE_REQUEST',
      status: 'PENDING',
      target: { id: newManga.id },
      note,
      targetPath: 'Manga',
      newValues: newManga.toJSON(),
      oldValues: null,
      author: { id: this.user!.id }
    });

    return newManga;
  }

  public async update(mangaID: string, note?: string) {
    const newMangaData = new MangaModel(this.newData);

    const mangaToUpdate = await MangaModel.findOne({ id: mangaID }, {}, { session: this.session });

    if (!mangaToUpdate) throw new Error('Manga not found');

    newMangaData._id = mangaToUpdate._id;
    newMangaData.id = mangaToUpdate.id;

    const changes = await getChangedData(mangaToUpdate.toJSON(), newMangaData, [
      '_id',
      'id',
      'createdAt',
      'updatedAt'
    ]);

    if (!changes) throw new Error('No changes found');

    await mangaToUpdate.updateOne({ $set: changes.newValues }, { session: this.session });


    await new PatchManager(this.session, this.user!).PatchCreate({
      type: 'UPDATE',
      status: 'ACCEPTED',
      target: { id: newMangaData.id },
      note,
      targetPath: 'Manga',
      newValues: changes?.newValues,
      oldValues: changes?.oldValues,
      author: { id: this.user!.id }
    });

    return newMangaData;
  }

  public async updateRequest(mangaID: string, note?: string) {
    const newMangaData = new MangaModel(this.newData);

    const mangaToUpdate = await MangaModel.findOne({ id: mangaID }, {}, { session: this.session });

    if (!mangaToUpdate) throw new Error('Manga not found');

    newMangaData._id = mangaToUpdate._id;
    newMangaData.id = mangaToUpdate.id;

    const changes = await getChangedData(mangaToUpdate.toJSON(), newMangaData, [
      '_id',
      'id',
      'createdAt',
      'updatedAt'
    ]);

    if (!changes) throw new Error('No changes found');

    await mangaToUpdate.updateOne({ $set: changes.newValues }, { session: this.session });


    await new PatchManager(this.session, this.user!).PatchCreate({
      type: 'UPDATE_REQUEST',
      status: 'PENDING',
      target: { id: newMangaData.id },
      note,
      targetPath: 'Manga',
      newValues: changes?.newValues,
      oldValues: changes?.oldValues,
      author: { id: this.user!.id }
    });

    return newMangaData;
  }
}
