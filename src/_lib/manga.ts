import { ClientSession, Document } from "mongoose";
import { MangaModel } from "@actunime/mongoose-models";
import {
  IManga,
  IMangaInput,
  IUser,
  IPaginationResponse,
} from "@actunime/types";
import { ICreate_Manga_ZOD, IManga_Pagination_ZOD } from "@actunime/validations";
import { PatchManager } from "./patch";
import { GroupeManager } from "./groupe";
import { CompanyManager } from "./company";
import { PersonManager } from "./person";
import { CharacterManager } from "./character";
import { getChangedDataV2 } from "@actunime/utils";
import { MediaPagination } from "./pagination";
import { ImageManager } from "./image";
import { APIError } from "./Error";

export class MangaManager {
  private user?: IUser;
  private session: ClientSession;
  private newData!: Partial<IMangaInput>;
  private coverManager: ImageManager;
  private bannerManager: ImageManager;
  private isRequest?: boolean;

  private groupeManager: GroupeManager;
  private companyManager: CompanyManager;
  private personManager: PersonManager;
  private characterManager: CharacterManager;
  private patchManager: PatchManager;

  constructor(session: ClientSession, options: { user?: IUser, isRequest?: boolean }) {
    this.user = options.user;
    this.session = session;
    this.isRequest = options.isRequest;
    this.groupeManager = new GroupeManager(session, options);
    this.companyManager = new CompanyManager(session, options);
    this.personManager = new PersonManager(session, options);
    this.characterManager = new CharacterManager(session, options);
    this.coverManager = new ImageManager(session, { ...options, targetPath: "Manga" });
    this.bannerManager = new ImageManager(session, { ...options, targetPath: "Manga" });
    this.patchManager = new PatchManager(session, options);
  }

  private async populate(
    doc: Document | IPaginationResponse<IManga>,
    withMedia: IManga_Pagination_ZOD["with"],
  ) {
    const match = { $or: [{ isVerified: this?.user?.preferences?.displayUnverifiedMedia ? { $ne: true } : true }, { isVerified: true }] };
    if (withMedia?.groupe)
      await MangaModel.populate(doc, {
        path: "groupe.data",
        select: "-_id",
        justOne: true,
        match,
        options: { session: this.session },
      });

    if (withMedia?.parent)
      await MangaModel.populate(doc, {
        path: "parent.data",
        select: "-_id",
        justOne: true,
        match,
        options: { session: this.session },
      });

    if (withMedia?.source)
      await MangaModel.populate(doc, {
        path: "source.data",
        select: "-_id",
        justOne: true,
        match,
        options: { session: this.session },
      });

    if (withMedia?.staffs)
      await MangaModel.populate(doc, {
        path: "staffs.data",
        select: "-_id",
        justOne: true,
        match,
        options: { session: this.session },
      });

    if (withMedia?.companys)
      await MangaModel.populate(doc, {
        path: "companys.data",
        select: "-_id",
        justOne: true,
        match,
        options: { session: this.session },
      });

    if (withMedia?.characters)
      await MangaModel.populate(doc, {
        path: "characters.data",
        select: "-_id",
        justOne: true,
        match,
        options: { session: this.session },
      });
  }

  public async get(id: string, withMedia?: IManga_Pagination_ZOD["with"]) {
    const findManga = await MangaModel.findOne({ id }, null, {
      session: this.session,
    }).select("-_id");

    if (!findManga)
      throw new APIError("Aucun manga avec cet identifiant", "NOT_FOUND", 404);

    if (withMedia) await this.populate(findManga, withMedia);

    return findManga.toJSON();
  }

  public async filter(paginationInput: IManga_Pagination_ZOD) {
    const pagination = new MediaPagination({ model: MangaModel });

    pagination.setPagination({
      page: paginationInput.page,
      limit: paginationInput.limit,
    });

    const query = paginationInput.query;
    const sort = paginationInput.sort;

    if (query?.name) pagination.searchByName(query.name, "title.default");

    if (paginationInput.strict) {
      pagination.setStrict(paginationInput.strict);
    } else if (query?.name)
      // Si c'est pas en strict chercher aussi dans les alias
      pagination.searchByName(query.name, "title.alias");
    // Le strict risque de faire que les noms doivent correspondre tout les deux a la recherche

    if (sort) pagination.setSort(sort);

    const response = await pagination.getResults(this.user?.preferences?.displayUnverifiedMedia || query?.allowUnverified || false);

    if (paginationInput.with)
      await this.populate(response, paginationInput.with);

    return response;
  }

  public async init(data: ICreate_Manga_ZOD) {
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
      // Data
      ...rawData
    } = data;

    this.newData = rawData as Partial<IMangaInput>;

    const { newData } = this;

    // ? Groupe
    if (groupe)
      newData.groupe = await this.groupeManager.createRelation(
        groupe,
      );

    // ? Parent
    if (parent) {
      if (!newData.parent) newData.parent = {};

      if (parent.id)
        if (await MangaModel.exists({ id: parent.id }))
          newData.parent["id"] = parent.id;
        else throw new Error("parent not found");

      if (parent.parentLabel)
        newData.parent["parentLabel"] = parent.parentLabel;
    }

    // ? Source
    if (source) {
      if (!newData.source) newData.source = {};

      if (source.id)
        if (await MangaModel.exists({ id: source.id }))
          newData.source["id"] = source.id;
        else throw new Error("Source not found");

      if (source.sourceLabel)
        newData.source["sourceLabel"] = source.sourceLabel;
    }

    if (companys)
      newData.companys = await this.companyManager.createMultipleRelation(companys);

    if (staffs)
      newData.staffs = await this.personManager.createMultipleRelation(staffs);

    if (characters)
      newData.characters = await this.characterManager.createMultipleRelation(characters);

    if (cover) {
      newData.cover = await this.coverManager.createRelation(cover);
    }

    if (banner) {
      newData.banner = await this.bannerManager.createRelation(banner);
    }

    return this;
  }

  public async create(note?: string) {
    const newManga = new MangaModel(this.newData);
    try {
      newManga.isVerified = true;
      await newManga.save({ session: this.session });

      await this.patchManager.PatchCreate({
        type: "CREATE",
        status: "ACCEPTED",
        target: { id: newManga.id },
        note,
        targetPath: "Manga",
        newValues: newManga.toJSON(),
        oldValues: null,
        author: { id: this.user!.id },
      });

      return newManga;
    } catch (err) {
      await this.coverManager?.deleteImageIfSaved();
      await this.bannerManager?.deleteImageIfSaved();
      throw err;
    }
  }

  public async createRequest(note?: string) {
    try {
      const newManga = new MangaModel(this.newData);
      newManga.isVerified = false;

      // Pré-disposition d'un manga qui est en cours de création.
      await newManga.save({ session: this.session });

      await this.patchManager.PatchCreate({
        type: "CREATE_REQUEST",
        status: "PENDING",
        target: { id: newManga.id },
        note,
        targetPath: "Manga",
        newValues: newManga.toJSON(),
        oldValues: null,
        author: { id: this.user!.id },
      });

      return newManga;
    } catch (err) {
      await this.coverManager?.deleteImageIfSaved();
      await this.bannerManager?.deleteImageIfSaved();
      throw err;
    }
  }

  public async patch(mangaID: string, note?: string) {
    try {
      const newMangaData = new MangaModel(this.newData);

      const mangaToUpdate = await MangaModel.findOne(
        { id: mangaID },
        {},
        { session: this.session },
      );

      if (!mangaToUpdate)
        throw new APIError("Aucun manga correspondant", "NOT_FOUND", 404);

      newMangaData._id = mangaToUpdate._id;
      newMangaData.id = mangaToUpdate.id;

      const changes = getChangedDataV2(mangaToUpdate.toJSON(), newMangaData, [
        "_id",
        "id",
        "createdAt",
        "updatedAt",
      ]);

      if (!changes?.newValues)
        throw new APIError(
          "Aucun changement n'a été détecté",
          "EMPTY_CHANGES",
          400,
        );

      await mangaToUpdate.updateOne(
        { $set: changes.newValues },
        { session: this.session },
      );

      await this.patchManager.PatchCreate({
        type: "PATCH",
        status: "ACCEPTED",
        target: { id: newMangaData.id },
        note,
        targetPath: "Manga",
        newValues: changes?.newValues,
        oldValues: changes?.oldValues,
        author: { id: this.user!.id },
      });

      if (this.coverManager?.hasNewImage())
        await this.coverManager?.deleteImageFile(mangaToUpdate.cover?.id);

      return newMangaData;
    } catch (err) {
      await this.coverManager?.deleteImageIfSaved();
      await this.bannerManager?.deleteImageIfSaved();
      throw err;
    }
  }

  public async updateRequest(mangaID: string, note?: string) {
    try {
      const newMangaData = new MangaModel(this.newData);

      const mangaToUpdate = await MangaModel.findOne(
        { id: mangaID },
        {},
        { session: this.session },
      );

      if (!mangaToUpdate)
        throw new APIError("Aucun manga correspondant", "NOT_FOUND", 404);

      newMangaData._id = mangaToUpdate._id;
      newMangaData.id = mangaToUpdate.id;

      const changes = getChangedDataV2(mangaToUpdate.toJSON(), newMangaData, [
        "_id",
        "id",
        "createdAt",
        "updatedAt",
      ]);

      if (!changes?.newValues)
        throw new APIError(
          "Aucun changement n'a été détecté",
          "EMPTY_CHANGES",
          400,
        );

      await mangaToUpdate.updateOne(
        { $set: changes.newValues },
        { session: this.session },
      );

      await this.patchManager.PatchCreate({
        type: "UPDATE_REQUEST",
        status: "PENDING",
        target: { id: newMangaData.id },
        note,
        targetPath: "Manga",
        newValues: changes?.newValues,
        oldValues: changes?.oldValues,
        author: { id: this.user!.id },
      });

      return newMangaData;
    } catch (err) {
      await this.coverManager?.deleteImageIfSaved();
      await this.bannerManager?.deleteImageIfSaved();
      throw err;
    }
  }

  public async getChanges(sourceID: string, ignoreKeys?: string[]) {
    const oldValues = await this.get(sourceID);
    const model = new MangaModel({ ...oldValues, ...this.newData });
    await model.validate();

    const newValues = model.toJSON();

    return getChangedDataV2<IManga>(oldValues, newValues, ignoreKeys || ["_id", "createdAt", "updatedAt"]);
  }
}
