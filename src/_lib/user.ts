import { ClientSession, Document } from 'mongoose';
import { IUser } from '../_types/userType';
import { IPatch_User_ZOD, IUser_Pagination_ZOD } from '../_validation/userZOD';
import { PatchManager } from './patch';
import { UserModel } from '../_models';
import { getChangedData } from '../_utils/getObjChangeUtil';

import { MediaPagination } from './pagination';
import { IPaginationResponse } from '@/_types/paginationType';
import { IUserRoles, userPermissionIsHigherThan } from '@/_utils/userUtil';
import { ImageManager } from './image';
import { APIError } from './Error';

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
      pagination.searchByName(query.name, 'username');
      pagination.searchByName(query.name, 'displayName');
    }

    if (paginationInput.strict) {
      pagination.setStrict(paginationInput.strict);
    }

    if (sort) pagination.setSort(sort);

    const response = await pagination.getResults();

    if (paginationInput.with) await this.populate(response, paginationInput.with);

    return response;
  }

  public async init(data: Partial<IPatch_User_ZOD>) {
    const { images, ...rawData } = data;

    this.newData = rawData as Partial<IUser>;

    const { newData, user, session } = this;

    if (images)
      newData.images = await new ImageManager(session, 'User', user)
        .createMultipleRelation(images);

    return this;
  }

  private async updateUsername(userID: string, username: string, note?: string) {
    const userToUpdate = await UserModel.findOne({ id: userID }, {}, { session: this.session });

    if (!userToUpdate) throw new APIError("Aucun utilisateur n'a été trouvé", "NOT_FOUND", 404);

    await userToUpdate.updateOne({ username }, { session: this.session });

    const changes = await getChangedData({ username: userToUpdate.username }, { username });

    if (!changes) throw new APIError("Aucun changement n'a été effectué", "NOT_FOUND", 404);

    await new PatchManager(this.session, this.user!)
      .PatchCreate({
        type: 'UPDATE',
        status: 'ACCEPTED',
        target: { id: userToUpdate.id },

        targetPath: 'User',
        newValues: changes?.newValues,
        oldValues: changes?.oldValues,
        author: { id: this.user!.id }
      });
  }

  private async updateDisplayName(userID: string, displayName: string, note?: string) {
    const userToUpdate = await UserModel.findOne({ id: userID }, {}, { session: this.session });

    if (!userToUpdate) throw new Error('User not found');

    await userToUpdate.updateOne({ displayName }, { session: this.session });

    const changes = await getChangedData({ displayName: userToUpdate.displayName }, { displayName });

    if (!changes) throw new APIError("Aucun changement n'a été effectué", "NOT_FOUND", 404);

    await new PatchManager(this.session, this.user!)
      .PatchCreate({
        type: 'UPDATE',
        status: 'ACCEPTED',
        target: { id: userToUpdate.id },

        targetPath: 'User',
        newValues: changes?.newValues,
        oldValues: changes?.oldValues,
        author: { id: this.user!.id }
      });
  }

  private async updateBio(userID: string, bio: string, note?: string) {
    const userToUpdate = await UserModel.findOne({ id: userID }, {}, { session: this.session });

    if (!userToUpdate) throw new Error('User not found');

    await userToUpdate.updateOne({ bio }, { session: this.session });

    const changes = await getChangedData({ bio: userToUpdate.bio }, { bio });

    if (!changes) throw new APIError("Aucun changement n'a été effectué", "NOT_FOUND", 404);

    await new PatchManager(this.session, this.user!)
      .PatchCreate({
        type: 'UPDATE',
        status: 'ACCEPTED',
        target: { id: userToUpdate.id },

        targetPath: 'User',
        newValues: changes?.newValues,
        oldValues: changes?.oldValues,
        author: { id: this.user!.id }
      });
  }

  private async updateRoles(userID: string, roles: IUserRoles[], note?: string) {
    const userToUpdate = await UserModel.findOne({ id: userID }, {}, { session: this.session });

    if (!userToUpdate) throw new Error('User not found');

    const changes = await getChangedData({ roles: userToUpdate.roles }, { roles });

    if (!changes) throw new APIError("Aucun changement n'a été effectué", "NOT_FOUND", 404);

    if (userPermissionIsHigherThan(userToUpdate.roles, this.user!.roles))
      throw new Error("Le(s) rôle(s) de l'utilisateurs que vous souhaitez modifier sont plus hauts que vous");

    if (!userPermissionIsHigherThan(this.user!.roles, roles))
      throw new Error('Vous n\'avez pas les permissions pour ajouter ces rôles');

    await userToUpdate.updateOne({ roles }, { session: this.session });

    await new PatchManager(this.session, this.user!)
      .PatchCreate({
        type: 'UPDATE',
        status: 'ACCEPTED',
        target: { id: userToUpdate.id },

        targetPath: 'User',
        newValues: changes?.newValues,
        oldValues: changes?.oldValues,
        author: { id: this.user!.id }
      });
  }

  private async updateImages(userID: string, images: IUser['images'], note?: string) {
    const userToUpdate = await UserModel.findOne({ id: userID }, {}, { session: this.session });

    if (!userToUpdate) throw new APIError("Aucun utilisateur n'a été trouvé", "NOT_FOUND", 404);

    // const changes = await getChangedData({ images: userToUpdate.images }, { images });

    // if (!changes) throw new APIError("Aucun changement n'a été effectué", "NOT_FOUND", 404);

    await userToUpdate.updateOne({ images }, { session: this.session });

    await new PatchManager(this.session, this.user!)
      .PatchCreate({
        type: 'UPDATE',
        status: 'ACCEPTED',
        target: { id: userToUpdate.id },

        targetPath: 'User',
        // changes: changes?.newValues,
        // beforeChanges: changes?.oldValues,
        author: { id: this.user!.id }
      });
  }


  public async update(userID: string, note?: string) {
    const { username, displayName, bio, roles, images } = this.newData;

    if (username)
      await this.updateUsername(userID, username, note);

    if (displayName)
      await this.updateDisplayName(userID, displayName, note);

    if (bio)
      await this.updateBio(userID, bio, note);

    if (roles)
      await this.updateRoles(userID, roles, note);

    if (images)
      await this.updateImages(userID, images, note);
  }

  public async updateRequest(userID: string, note?: string) {
    const newUserData = new UserModel(this.newData);

    const userToUpdate = await UserModel.findOne({ id: userID }, {}, { session: this.session });

    if (!userToUpdate) throw new Error('User not found');

    newUserData._id = userToUpdate._id;
    newUserData.id = userToUpdate.id;

    const changes = getChangedData(userToUpdate.toJSON(), newUserData, [
      '_id',
      'id',
      'createdAt',
      'updatedAt'
    ]);

    if (!changes) throw new APIError("Aucun changement n'a été effectué", "NOT_FOUND", 404);

    await userToUpdate.updateOne({ $set: changes.newValues }, { session: this.session });
  
    await new PatchManager(this.session, this.user!).PatchCreate({
      type: 'UPDATE_REQUEST',
      status: 'PENDING',
      target: { id: newUserData.id },
      note,
      targetPath: 'User',
      newValues: changes?.newValues,
      oldValues: changes?.oldValues,
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
