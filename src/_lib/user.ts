import { ClientSession, Document } from 'mongoose';
import { IUser } from '../_types/userType';
import { IUser_Pagination_ZOD } from '../_validation/userZOD';
import { PatchManager } from './patch';
import { UserModel } from '../_models';
import { getChangedData } from '../_utils/getObjChangeUtil';
import { IPatchActionList } from '../_types/patchType';
import { MediaPagination } from './pagination';
import { IPaginationResponse } from '@/_types/paginationType';

export class UserManager {
  private user?: IUser;
  private session: ClientSession;
  private newData!: Partial<IUser>;
  constructor(session: ClientSession, user?: IUser) {
    this.user = user;
    this.session = session;
  }

  private async populate(
    doc: Document | IPaginationResponse<IUser>,
    withMedia: IUser_Pagination_ZOD['with']
  ) {
    // if (withMedia?.actors)
    //     await UserModel.populate(doc, { path: '', select: '-_id', justOne: true, options: { session: this.session } });
  }

  public async get(id: string, withMedia?: IUser_Pagination_ZOD['with']) {
    const findUser = await UserModel.findOne({ id }, null, { session: this.session }).select(
      '-_id'
    );

    if (!findUser) throw new Error('User not found');

    if (withMedia) await this.populate(findUser, withMedia);

    return findUser.toJSON();
  }

  public async filter(paginationInput: IUser_Pagination_ZOD) {
    const pagination = new MediaPagination({ model: UserModel });

    pagination.setPagination({ page: paginationInput.page, limit: paginationInput.limit });

    const query = paginationInput.query;
    const sort = paginationInput.sort;

    if (query?.name) {
      pagination.searchByName(query.name, 'name.first');
      pagination.searchByName(query.name, 'name.last');
    }

    if (paginationInput.strict) {
      pagination.setStrict(paginationInput.strict);
    } else if (query?.name)
      // Si c'est pas en strict chercher aussi dans les alias
      pagination.searchByName(query.name, 'name.alias');
    // Le strict risque de faire que les noms doivent correspondre tout les deux a la recherche

    if (sort) pagination.setSort(sort);

    const response = await pagination.getResults();

    if (paginationInput.with) await this.populate(response, paginationInput.with);

    return response;
  }

  // public async init(data: Partial<ICreate_User_ZOD>) {
  //     const {
  //         // Relations
  //         actors,
  //         // Data
  //         ...rawData
  //     } = data;
  //     this.newData = rawData as Partial<IUser>;

  //     const { newData, user, session } = this;

  //     if (actors)
  //         newData.actors = await new PersonManager(session, user).createMultipleRelation(actors);

  //     return this;
  // }

  public async create(note?: string) {
    const newUser = new UserModel(this.newData);
    // newUser.isVerified = true;
    await newUser.save({ session: this.session });

    const actions: IPatchActionList[] = [{ note, label: 'DIRECT_CREATE', user: this.user! }];

    await new PatchManager(this.session, this.user!).PatchCreate({
      type: 'CREATE',
      status: 'ACCEPTED',
      target: { id: newUser.id },
      actions,
      targetPath: 'User',
      changes: newUser.toJSON(),
      beforeChanges: null,
      author: { id: this.user!.id }
    });

    return newUser;
  }

  public async createRequest(note?: string) {
    const newUser = new UserModel(this.newData);

    // newUser.isVerified = false;

    // Pré-disposition d'un user qui est en cours de création.
    await newUser.save({ session: this.session });

    const actions: IPatchActionList[] = [{ note, label: 'REQUEST', user: this.user! }];

    await new PatchManager(this.session, this.user!).PatchCreate({
      type: 'CREATE_REQUEST',
      status: 'PENDING',
      target: { id: newUser.id },
      actions,
      targetPath: 'User',
      changes: newUser.toJSON(),
      beforeChanges: null,
      author: { id: this.user!.id }
    });

    return newUser;
  }

  public async update(userID: string, note?: string) {
    const newUserData = new UserModel(this.newData);

    const userToUpdate = await UserModel.findOne({ id: userID }, {}, { session: this.session });

    if (!userToUpdate) throw new Error('User not found');

    newUserData._id = userToUpdate._id;
    newUserData.id = userToUpdate.id;

    const changes = await getChangedData(userToUpdate.toJSON(), newUserData, [
      '_id',
      'id',
      'createdAt',
      'updatedAt'
    ]);

    if (!changes) throw new Error('No changes found');

    await userToUpdate.updateOne({ $set: changes.newValues }, { session: this.session });

    const actions: IPatchActionList[] = [{ note, label: 'DIRECT_PATCH', user: this.user! }];

    await new PatchManager(this.session, this.user!).PatchCreate({
      type: 'UPDATE',
      status: 'ACCEPTED',
      target: { id: newUserData.id },
      actions,
      targetPath: 'User',
      changes: changes?.newValues,
      beforeChanges: changes?.oldValues,
      author: { id: this.user!.id }
    });

    return newUserData;
  }

  public async updateRequest(userID: string, note?: string) {
    const newUserData = new UserModel(this.newData);

    const userToUpdate = await UserModel.findOne({ id: userID }, {}, { session: this.session });

    if (!userToUpdate) throw new Error('User not found');

    newUserData._id = userToUpdate._id;
    newUserData.id = userToUpdate.id;

    const changes = await getChangedData(userToUpdate.toJSON(), newUserData, [
      '_id',
      'id',
      'createdAt',
      'updatedAt'
    ]);

    if (!changes) throw new Error('No changes found');

    await userToUpdate.updateOne({ $set: changes.newValues }, { session: this.session });

    const actions: IPatchActionList[] = [{ note, label: 'REQUEST', user: this.user! }];

    await new PatchManager(this.session, this.user!).PatchCreate({
      type: 'UPDATE_REQUEST',
      status: 'PENDING',
      target: { id: newUserData.id },
      actions,
      targetPath: 'User',
      changes: changes?.newValues,
      beforeChanges: changes?.oldValues,
      author: { id: this.user!.id }
    });

    return newUserData;
  }

  // public async createRelation(relation: IAdd_User_ZOD) {
  //     if (relation.newUser) {
  //         const initChataracter = await this.init(relation.newUser);
  //         const newUser = await initChataracter.create();
  //         return { id: newUser.id, role: relation.role };
  //     } else if (relation.id && (await UserModel.exists({ id: relation.id }))) {
  //         return { id: relation.id, role: relation.role };
  //     } else {
  //         throw new Error('User invalide');
  //     }
  // }

  // public async createMultipleRelation(relations: IAdd_User_ZOD[]) {
  //     const relList: { id: string; role: IAdd_User_ZOD['role'] }[] = [];
  //     for await (const relation of relations) {
  //         const rel = await this.createRelation(relation);
  //         relList.push(rel);
  //     }
  //     return relList;
  // }
}
