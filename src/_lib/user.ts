import { ClientSession, Document, Schema } from 'mongoose';
import { IUser } from '../_types/userType';
import { IPatch_User_ZOD, IUser_Pagination_ZOD } from '../_validation/userZOD';
import { UserModel } from '../_models';
import { getChangedData } from '../_utils/getObjChangeUtil';

import { MediaPagination } from './pagination';
import { IUserRoles, userPermissionIsHigherThan } from '@/_utils/userUtil';
import { ImageManager } from './image';
import { APIError } from './Error';
import { PatchManager } from './patch';

type DocUser = Document<unknown, object, IUser> & IUser & Required<{ _id: Schema.Types.ObjectId }>

export class UserManager {
  private user?: IUser;
  private session: ClientSession;
  private newData!: Partial<IUser>;
  constructor(session: ClientSession, user?: IUser) {
    this.user = user;
    this.session = session;
  }

  private async populate(
    doc: DocUser,
    withMedia: IUser_Pagination_ZOD['with']
  ) {
  
  }

  public async get(id: string, withMedia?: IUser_Pagination_ZOD['with']) {
    const findUser = await UserModel.findOne({ id }, null, { session: this.session })
    .select('-_id');

    if (!findUser) throw new Error('User not found');

    await this.populate(findUser, withMedia);

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

    if (paginationInput.with) await this.populate(response as any, paginationInput.with);

    return response;
  }

  public async init(data: Partial<IPatch_User_ZOD>) {
    console.log("INIT", data)
    const { avatar, banner, ...rawData } = data;

    this.newData = rawData as Partial<IUser>;

    const { newData, user, session } = this;

    if (avatar)
      newData.avatar = await new ImageManager(session, 'User', user)
        .createRelation(avatar);

    return this;
  }

  private async updateUsername(userDoc: DocUser, username: string) {

    const changes = getChangedData({ username: userDoc.username }, { username });
    if (!changes)
      throw new APIError("Aucun changement n'a été effectué sur le nom d'utilisateur", "EMPTY_CHANGES", 400);

    await userDoc.updateOne({ username }, { session: this.session });
  }

  private async updateDisplayName(userDoc: DocUser, displayName: string) {

    const changes = getChangedData({ displayName: userDoc.displayName }, { displayName });
    if (!changes)
      throw new APIError("Aucun changement n'a été effectué sur le pseudonyme", "EMPTY_CHANGES", 400);

    await userDoc.updateOne({ displayName }, { session: this.session });
  }

  private async updateBio(userDoc: DocUser, bio: string) {

    const changes = getChangedData({ bio: userDoc.bio }, { bio });

    if (!changes)
      throw new APIError("Aucun changement n'a été effectué sur la biographie", "EMPTY_CHANGES", 400);

    await userDoc.updateOne({ bio }, { session: this.session });
  }

  private async updateRoles(userDoc: DocUser, roles: IUserRoles[]) {
    const changes = getChangedData({ roles: userDoc.roles }, { roles });
    if (!changes)
      throw new APIError("Aucun changement n'a été effectué sur les rôles", "EMPTY_CHANGES", 400);

    if (userPermissionIsHigherThan(userDoc.roles, this.user!.roles))
      throw new APIError("Le(s) rôle(s) de l'utilisateurs que vous souhaitez modifier sont plus hauts que vous", "FORBIDDEN", 403);

    if (!userPermissionIsHigherThan(this.user!.roles, roles))
      throw new APIError('Vous n\'avez pas les permissions pour ajouter ces rôles', 'FORBIDDEN', 403);

    await userDoc.updateOne({ roles }, { session: this.session });
  }

  private async updateAvatar(userDoc: DocUser, avatar: IUser['avatar']) {
    await userDoc.updateOne({ avatar }, { session: this.session });
  }

  private async updateBanner(userDoc: DocUser, banner: IUser['banner']) {
    await userDoc.updateOne({ banner }, { session: this.session });
  }

  public async update(userID: string, note?: string) {
    let userToUpdate = await UserModel.findOne({ id: userID }, {}, { session: this.session });

    if (!userToUpdate) throw new APIError("Aucun utilisateur n'a été trouvé", "NOT_FOUND", 404);

    const changes = getChangedData<IUser>(userToUpdate.toJSON(), this.newData, [
      '_id',
      'id',
      'createdAt',
      'updatedAt'
    ]);


    if (!changes) throw new APIError("Aucun changement n'a été effectué", "EMPTY_CHANGES", 400);

    if (changes.newValues.username)
      await this.updateUsername(userToUpdate, changes.newValues.username);

    if (changes.newValues.displayName)
      await this.updateDisplayName(userToUpdate, changes.newValues.displayName);

    if (changes.newValues.bio)
      await this.updateBio(userToUpdate, changes.newValues.bio);

    if (changes.newValues.roles)
      await this.updateRoles(userToUpdate, changes.newValues.roles);

    if (changes.newValues.avatar)
      await this.updateAvatar(userToUpdate, changes.newValues.avatar);

    if (changes.newValues.banner)
      await this.updateBanner(userToUpdate, changes.newValues.banner);

    await new PatchManager(this.session, this.user!).PatchCreate({
      type: "UPDATE",
      status: "ACCEPTED",
      target: { id: userToUpdate.id },
      note,
      targetPath: 'User',
      newValues: changes?.newValues,
      oldValues: changes?.oldValues,
      author: { id: this.user!.id }
    });

    userToUpdate = await UserModel.findOne({ id: userID }, {}, { session: this.session });
    if (!userToUpdate) throw new APIError("Aucun utilisateur n'a été trouvé", "NOT_FOUND", 404);

    return userToUpdate.toJSON();
  }

}
