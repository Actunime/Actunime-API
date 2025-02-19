import { ClientSession, Document, Schema } from "mongoose";
import { IUser, IUserAnimeListe, IUserPreferences, IUserRoles, userPermissionIsHigherThan } from "@actunime/types";
import { IPatch_User_ZOD, IPatch_UserPreferences_ZOD, IUser_Pagination_ZOD, IUserAnimeListe_ZOD } from "@actunime/validations";
import { AccountModel, AnimeModel, UserModel } from "@actunime/mongoose-models";
import { DevLog, getChangedDataV2 } from "@actunime/utils";

import { MediaPagination } from "./pagination";
import { ImageManager } from "./image";
import { APIError } from "./Error";
import { PatchManager } from "./patch";

type DocUser = Document<unknown, object, IUser> &
  IUser &
  Required<{ _id: Schema.Types.ObjectId }>;

export class UserManager {
  private user?: IUser;
  private session: ClientSession;
  private newData!: Partial<IUser>;
  private rawData!: Partial<IPatch_User_ZOD>
  private avatarManager: ImageManager;
  private bannerManager: ImageManager;
  private patchManager: PatchManager;

  constructor(session: ClientSession, options: { user?: IUser, isRequest?: boolean }) {
    this.user = options.user;
    this.session = session;
    this.avatarManager = new ImageManager(session, { ...options, targetPath: "User" });
    this.bannerManager = new ImageManager(session, { ...options, targetPath: "User" });
    this.patchManager = new PatchManager(session, options);
  }

  private async populate(
    doc: DocUser | IUser,
    withMedia: IUser_Pagination_ZOD["with"],
    disableSession = false
  ) {

    const match = { $or: [{ isVerified: this?.user?.preferences?.displayUnverifiedMedia ? { $ne: true } : true }, { isVerified: true }] };
    if (withMedia?.avatar)
      await UserModel.populate(doc, {
        path: "avatar.data",
        select: "-_id",
        justOne: true,
        ...this.user?.id === doc.id ? {} : { match },
        options: { session: disableSession ? undefined : this.session },
      });

    if (withMedia?.banner)
      await UserModel.populate(doc, {
        path: "banner.data",
        select: "-_id",
        justOne: true,
        ...this.user?.id === doc.id ? {} : { match },
        options: { session: disableSession ? undefined : this.session },
      });

    return doc;
  }

  public async get(id: string, withMedia?: IUser_Pagination_ZOD["with"], disableSession = false) {
    const findUser = await UserModel.findOne({ id }, null, {
      session: disableSession ? undefined : this.session,
    }).select("-_id");

    if (!findUser) throw new Error("User not found");

    const user = (await this.populate(findUser.toJSON(), withMedia, disableSession)) as DocUser;
    return user;
  }

  public async getByEmail(email: string, withMedia?: IUser_Pagination_ZOD["with"]) {
    const findAccount = await AccountModel.findOne({ email }, null, {
      session: this.session,
    }).select("-_id");

    if (!findAccount) throw new Error("Account not found");

    const user = await this.get(findAccount.userId, withMedia);

    return user;
  }

  public async filter(paginationInput: IUser_Pagination_ZOD) {
    const pagination = new MediaPagination({ model: UserModel });

    pagination.setPagination({
      page: paginationInput.page,
      limit: paginationInput.limit,
    });

    const query = paginationInput.query;
    const sort = paginationInput.sort;

    if (query?.name) {
      pagination.searchByName(query.name, "username");
      pagination.searchByName(query.name, "displayName");
    }

    if (paginationInput.strict) {
      pagination.setStrict(paginationInput.strict);
    }

    if (sort) pagination.setSort(sort);

    const response = await pagination.getResults(true);

    if (paginationInput.with)
      await this.populate(response.results as any, paginationInput.with);

    return response;
  }

  public async init(data: Partial<IPatch_User_ZOD>) {
    try {
      // this.rawData = data;
      const { avatar, banner, ...rawData } = data;

      this.newData = rawData as Partial<IUser>;

      const { newData } = this;

      if (avatar && Object.keys(avatar).length > 0) {
        newData.avatar = await this.avatarManager.createRelation(avatar, true);
      }

      if (banner && Object.keys(banner).length > 0) {
        newData.banner = await this.bannerManager.createRelation(banner, true);
      }

      return this;
    } catch (err) {
      await this.avatarManager?.deleteImageIfSaved();
      await this.bannerManager?.deleteImageIfSaved();
      throw err;
    }
  }

  private async updateRoles(userDoc: DocUser, roles: IUserRoles[]) {
    if (!this.user) throw new APIError("Vous n'êtes pas autorisé !", "UNAUTHORIZED");

    if (userPermissionIsHigherThan(["ADMINISTRATOR"], this.user.roles))
      throw new APIError("Vous n'avez pas les permissions necessaires", "FORBIDDEN", 403);

    if (userPermissionIsHigherThan(userDoc.roles, this.user.roles))
      throw new APIError(
        "Le(s) rôle(s) de l'utilisateurs que vous souhaitez modifier sont plus hauts que vous",
        "FORBIDDEN",
        403,
      );

    if (!userPermissionIsHigherThan(this.user.roles, roles))
      throw new APIError(
        "Vous n'avez pas les permissions pour ajouter ces rôles",
        "FORBIDDEN",
        403,
      );
  }


  public async patch(userID: string, note?: string) {
    try {
      const userToUpdate = await UserModel.findOne(
        { id: userID },
        {},
        { session: this.session },
      ).select("-_id");

      if (!userToUpdate)
        throw new APIError(
          "Aucun utilisateur n'a été trouvé",
          "NOT_FOUND",
          404,
        );

      const changes = await this.getChanges(userID);

      DevLog("Changements effectués sur l'utilisateur " + userToUpdate.id)
      console.warn(changes);

      if (!changes?.newValues)
        throw new APIError(
          "Aucun changement n'a été effectué",
          "EMPTY_CHANGES",
          400,
        );

      if (changes.newValues?.username) {
        if (await UserModel.exists({ username: changes.newValues.username }).session(this.session))
          throw new APIError(
            "Ce nom d'utilisateur est deja pris",
            "FORBIDDEN",
            409,
          );
      }

      if (changes.newValues?.roles)
        await this.updateRoles(userToUpdate, changes.newValues.roles);

      if (changes.newValues?.avatar)
        await this.avatarManager?.createImageFile(this.avatarManager.imageValue);

      if (changes.newValues?.banner)
        await this.bannerManager?.createImageFile(this.bannerManager.imageValue);

      await UserModel.updateOne({ id: userID },
        { ...changes.newValues },
        { session: this.session }
      );

      await this.patchManager.PatchCreate({
        type: "PATCH",
        status: "ACCEPTED",
        target: { id: userToUpdate.id },
        note,
        targetPath: "User",
        newValues: changes?.newValues,
        oldValues: changes?.oldValues,
        author: { id: this.user!.id },
      });

      if (this.avatarManager?.hasNewImage() && changes.oldValues?.avatar?.id)
        await ImageManager.deleteImageFileIfExist(
          changes.oldValues.avatar.id,
          "User",
        );

      if (this.bannerManager?.hasNewImage() && changes.oldValues?.banner?.id)
        await ImageManager.deleteImageFileIfExist(
          changes.oldValues.banner.id,
          "User",
        );

      const newUserData = await this.get(userID);

      return newUserData;
    } catch (err) {
      this.avatarManager?.deleteImageIfSaved();
      this.bannerManager?.deleteImageIfSaved();
      throw err;
    }
  }


  public async patchPreferences(preferences: IPatch_UserPreferences_ZOD, note?: string) {

    if (!this.user)
      throw new APIError(
        "Aucun utilisateur n'a été trouvé",
        "NOT_FOUND",
        404,
      );

    const changes = getChangedDataV2<IUser>(
      this.user?.preferences,
      preferences,
    );

    if (!changes?.newValues)
      throw new APIError(
        "Aucun changement n'a été effectué",
        "EMPTY_CHANGES",
        400,
      );

    await UserModel.updateOne({ id: this.user?.id },
      { $set: { preferences: { ...this.user?.preferences, ...changes.newValues } } },
      { session: this.session }
    );

    await this.patchManager.PatchCreate({
      type: "PATCH",
      status: "ACCEPTED",
      target: { id: this.user?.id },
      note,
      targetPath: "User",
      newValues: changes?.newValues,
      oldValues: changes?.oldValues,
      author: { id: this.user!.id },
    });

    const newUserData = await this.get(this.user?.id);

    return newUserData;
  }

  public async getChanges(sourceID: string, ignoreKeys?: string[]) {
    const oldValues = await this.get(sourceID);
    const model = new UserModel({ ...oldValues, ...this.newData });
    await model.validate();

    const newValues = model.toJSON();

    return getChangedDataV2<IUser>(oldValues, newValues, ignoreKeys || ["_id", "createdAt", "updatedAt"]);
  }

  public async updateAnimeToListe(data: IUserAnimeListe_ZOD) {
    const findUser = await UserModel.findOne({ id: this.user?.id }, null, { session: this.session });
    if (!findUser) throw new APIError("Utilisateur non trouvé", "NOT_FOUND", 404);

    const findAnime = await AnimeModel.findOne({ id: data.id }, null, { session: this.session });
    if (!findAnime) throw new APIError("Anime non trouvé", "NOT_FOUND", 404);

    const animeListe = findUser.animes.find((a) => a.id === data.id);

    if (data.status === "COMPLETED") {
      data.episode = findAnime?.episodes?.total;
      if (!data.completedAt)
        data.completedAt = new Date().toString();
    }

    if (data.status === "DROPPED") {
      if (!data.completedAt)
        data.completedAt = new Date().toString();
    }

    if (data.status === "WATCHING") {
      if (!data.startedAt)
        data.startedAt = new Date().toString();
    }

    if (animeListe) {
      let index = findUser.animes.indexOf(animeListe);
      if (index !== -1) {
        findUser.animes[index] = data as IUserAnimeListe;
        await findUser.save({ session: this.session });
      }
    } else {
      findUser.animes.push(data as IUserAnimeListe);
      await findUser.save({ session: this.session });
    }

    return findUser;
  }

  public async deleteAnimeToListe(animeID: string) {
    const findUser = await UserModel.findOne({ id: this.user?.id }, null, { session: this.session });
    if (!findUser) throw new APIError("Utilisateur non trouvé", "NOT_FOUND", 404);

    findUser.animes = findUser.animes.filter((a) => a.id !== animeID);
    await findUser.save({ session: this.session });

    return findUser;
  }
}
