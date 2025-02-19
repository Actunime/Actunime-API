import { ClientSession, Document, Schema } from "mongoose";
import { AnimeModel, MangaModel } from "@actunime/mongoose-models";
import { IAnime, IAnimeInput, IUser } from "@actunime/types";
import { IAnime_Pagination_ZOD, ICreate_Anime_ZOD } from "@actunime/validations";
import { PatchManager } from "./patch";
import { GroupeManager } from "./groupe";
import { CompanyManager } from "./company";
import { PersonManager } from "./person";
import { CharacterManager } from "./character";
import { TrackManager } from "./track";
import { DiscordWebhook } from "../_utils/_discordWebhook";
import { MediaPagination } from "./pagination";
import { ImageManager } from "./image";
import { APIError } from "./Error";
import diff from 'deep-diff';
import { getChangedDataV2 } from "@actunime/utils";

type IAnimeDoc = Document<unknown, {}, IAnime> & IAnime & Required<{
  _id: Schema.Types.ObjectId;
}> & {
  __v: number;
}

export class AnimeManager {
  private user?: IUser;
  private session: ClientSession;
  private newData!: Partial<IAnimeInput>;
  private coverManager: ImageManager;
  private bannerManager: ImageManager;
  private isRequest?: boolean;

  private groupeManager: GroupeManager;
  private companyManager: CompanyManager;
  private personManager: PersonManager;
  private characterManager: CharacterManager;
  private trackManager: TrackManager;
  private patchManager: PatchManager;

  constructor(session: ClientSession, options: { user?: IUser, isRequest?: boolean }) {
    this.user = options.user;
    this.session = session;
    this.isRequest = options.isRequest;
    this.groupeManager = new GroupeManager(session, options);
    this.companyManager = new CompanyManager(session, options);
    this.personManager = new PersonManager(session, options);
    this.characterManager = new CharacterManager(session, options);
    this.trackManager = new TrackManager(session, options);
    this.coverManager = new ImageManager(session, { ...options, targetPath: "Anime" });
    this.bannerManager = new ImageManager(session, { ...options, targetPath: "Anime" });
    this.patchManager = new PatchManager(session, options);
  }

  private async handleError(error: APIError | any) {
    await this.coverManager?.deleteImageIfSaved();
    await this.bannerManager?.deleteImageIfSaved();
    // throw new APIError(error.message, error.code, error.status);
  }

  private async populate(
    doc: Document | IAnime[],
    withMedia: IAnime_Pagination_ZOD["with"],
  ) {
    const match = { $or: [{ isVerified: this?.user?.preferences?.displayUnverifiedMedia ? { $ne: true } : true }, { isVerified: true }] };
    if (withMedia?.groupe)
      await AnimeModel.populate(doc, {
        path: "groupe.data",
        select: "-_id",
        justOne: true,
        match,
        options: { session: this.session },
      });

    if (withMedia?.parent)
      await AnimeModel.populate(doc, {
        path: "parent.data",
        select: "-_id",
        justOne: true,
        match,
        options: { session: this.session },
      });

    if (withMedia?.source)
      await AnimeModel.populate(doc, {
        path: "source.data",
        select: "-_id",
        justOne: true,
        match,
        options: { session: this.session },
      });

    if (withMedia?.staffs)
      await AnimeModel.populate(doc, {
        path: "staffs.data",
        select: "-_id",
        justOne: true,
        match,
        options: { session: this.session },
      });

    if (withMedia?.companys)
      await AnimeModel.populate(doc, {
        path: "companys.data",
        select: "-_id",
        justOne: true,
        match,
        options: { session: this.session },
      });

    if (withMedia?.characters)
      await AnimeModel.populate(doc, {
        path: "characters.data",
        select: "-_id",
        justOne: true,
        match,
        options: { session: this.session },
      });

    if (withMedia?.tracks)
      await AnimeModel.populate(doc, {
        path: "tracks.data",
        select: "-_id",
        justOne: true,
        match,
        options: { session: this.session },
      });

    if (withMedia?.cover)
      await AnimeModel.populate(doc, {
        path: "cover.data",
        select: "-_id",
        justOne: true,
        match,
        options: { session: this.session },
      });

    if (withMedia?.banner)
      await AnimeModel.populate(doc, {
        path: "banner.data",
        select: "-_id",
        justOne: true,
        match,
        options: { session: this.session },
      });
  }

  public async get(id: string, withMedia?: IAnime_Pagination_ZOD["with"]) {
    const findAnime = await AnimeModel.findOne({ id }, null, {
      session: this.session,
    }).select("-_id");

    if (!findAnime) throw new Error("Anime not found");
    if (withMedia)
      await this.populate(findAnime, withMedia);

    return findAnime.toJSON();
  }

  public async filter(paginationInput: IAnime_Pagination_ZOD) {
    const pagination = new MediaPagination({ model: AnimeModel });

    pagination.setPagination({
      page: paginationInput.page,
      limit: paginationInput.limit,
    });

    const query = paginationInput.query;
    const sort = paginationInput.sort;

    if (query?.name)
      pagination.searchByName(query.name, "title.default");

    if (paginationInput.strict) {
      pagination.setStrict(paginationInput.strict);
    } else if (query?.name)
      // Si c'est pas en strict chercher aussi dans les alias
      pagination.searchByName(query.name, "title.alias");
    // Le strict risque de faire que les noms doivent correspondre tout les deux a la recherche

    if (sort)
      pagination.setSort(sort);

    pagination.addSearchQuery([
      ...(query?.status ? [{ status: query.status }] : []),
      ...(query?.genres && query.genres.length
        ? [{ genres: { $in: query.genres } }]
        : []),
    ]);

    if (query?.ids) {
      pagination.addSearchQuery([
        { id: { $in: query.ids } }
      ]);
    }

    const response = await pagination.getResults(this.user?.preferences?.displayUnverifiedMedia || query?.allowUnverified || false);

    if (paginationInput.with)
      await this.populate(response.results, paginationInput.with);

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

      this.newData = rawData as Partial<IAnimeInput>;

      const { newData } = this;

      // ? Groupe
      if (groupe)
        newData.groupe = await this.groupeManager.createRelation(groupe);

      if (parent) {
        if (!newData.parent) newData.parent = {};

        if (parent.id)
          if (await AnimeModel.exists({ id: parent.id }))
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

      if (tracks)
        newData.tracks = await this.trackManager.createMultipleRelation(tracks);

      if (cover)
        newData.cover = await this.coverManager.createRelation(cover);

      if (banner)
        newData.banner = await this.bannerManager.createRelation(banner);

      return this;
    } catch (err) {
      await this.coverManager?.deleteImageIfSaved();
      await this.bannerManager?.deleteImageIfSaved();
      throw err;
    }
  }

  public async create(note?: string) {
    try {
      const newAnime = new AnimeModel({ ...this.newData, isVerified: true });
      await newAnime.save({ session: this.session });

      await this.patchManager
        .PatchCreate({
          type: "CREATE",
          status: "ACCEPTED",
          target: { id: newAnime.id },
          note,
          targetPath: "Anime",
          newValues: newAnime.toJSON(),
          oldValues: null,
          author: { id: this.user!.id },
        });

      return newAnime;
    } catch (err) {
      this.handleError(err);
    }
  }

  public async createRequest(note?: string) {
    try {
      const newAnime = new AnimeModel(this.newData);
      newAnime.isVerified = false;
      await newAnime.validate();

      // Pré-disposition d'un anime qui est en cours de création.
      await newAnime.save({ session: this.session });

      await this.patchManager
        .PatchCreate({
          note,
          type: "CREATE_REQUEST",
          status: "PENDING",
          target: { id: newAnime.id },
          targetPath: "Anime",
          newValues: newAnime.toJSON(),
          oldValues: null,
          author: { id: this.user!.id },
        });

      DiscordWebhook.info(`Anime | Demande de création`, `${newAnime.title.default} (${newAnime.id})`, `Utilisateur: ${this.user?.username} (${this.user?.id})`);

      return newAnime;
    } catch (err) {
      this.handleError(err);
    }
  }

  public async patch(animeID: string, note?: string) {
    try {
      const animeToUpdate = await AnimeModel
        .findOne({ id: animeID })
        .session(this.session);

      if (!animeToUpdate)
        throw new APIError(
          "Aucun anime correspondent a cet identifiant",
          "NOT_FOUND",
          404,
        );

      const ignoreKey = <T extends object, K extends keyof T>(obj: T, keys: K[]): T => {
        const result = {} as T;
        Object.keys(obj).forEach((key) => {
          if (!keys.includes(key as K)) {
            result[key] = obj[key];
          }
          if (typeof obj[key] === "object") {
            if (Array.isArray(obj[key])) {
              if (obj[key].length === 0)
                delete result[key];
            } else {
              if (Object.keys(obj[key]).length === 0)
                delete result[key];
            }
          }
        });
        return result;
      };
      const ignoreKeys: (keyof IAnimeDoc)[] = ["_id", "createdAt", "updatedAt", "isVerified", "__v"];
      const before = ignoreKey(animeToUpdate.toJSON() as IAnimeDoc, ignoreKeys);
      const appliedChanges = ignoreKey(animeToUpdate.toJSON() as IAnimeDoc, ignoreKeys)
      const after = ignoreKey({ ...this.newData, id: animeID } as IAnimeDoc, ignoreKeys);
      console.log('before', before);
      console.log('after', after);


      const changes = diff(before, after);
      // console.log("changesments", changes);
      if (!changes)
        throw new APIError(
          "Aucun changement n'a été détecté",
          "EMPTY_CHANGES",
          400,
        )

      console.log("modifications détectées", changes);

      diff.observableDiff(appliedChanges, after, (d) => {
        if (d.path?.find((p) => ignoreKeys.includes(p))) return;
        diff.applyChange(appliedChanges, after, d);
      });

      /** Suppression des anciennes images */
      if (this.coverManager?.hasNewImage() && animeToUpdate.cover?.id)
        await this.coverManager.deleteImageFile(animeToUpdate.cover?.id);

      if (this.bannerManager?.hasNewImage() && animeToUpdate.banner?.id)
        await this.bannerManager.deleteImageFile(animeToUpdate.banner?.id);
      /**  */

      console.log("applied changes", appliedChanges);

      await animeToUpdate.updateOne(
        {
          $set: appliedChanges
        },
        { session: this.session },
      )

      await this.patchManager
        .PatchCreate({
          type: "PATCH",
          status: "ACCEPTED",
          note,
          target: { id: after.id },
          targetPath: "Anime",
          newValues: appliedChanges,
          oldValues: before,
          author: { id: this.user!.id },
        });

      // if (process.env.NODE_ENV === 'production')
      //   DiscordWebhook.info(`Anime | Modification directe`, `${newAnimeData.title.default} (${newAnimeData.id})`, `Modérateur: ${this.user?.username} (${this.user?.id})`);

      return appliedChanges;
    } catch (err) {
      this.handleError(err);
      throw err;
    }
  }

  public async updateRequest(animeID: string, note?: string) {
    const newAnimeData = new AnimeModel(this.newData);
    try {
      const animeToUpdate = await AnimeModel.findOne(
        { id: animeID },
        {},
        { session: this.session },
      );

      if (!animeToUpdate)
        throw new APIError("Aucun anime correspondant", "NOT_FOUND", 404);

      newAnimeData._id = animeToUpdate._id;
      newAnimeData.id = animeToUpdate.id;

      const changes = getChangedDataV2(animeToUpdate.toJSON(), newAnimeData, [
        "_id",
        "id",
        "createdAt",
        "updatedAt",
      ]);

      if (!changes)
        throw new APIError(
          "Aucun changement n'a été détecté",
          "EMPTY_CHANGES",
          400,
        );

      await animeToUpdate.updateOne(
        { $set: changes.newValues },
        { session: this.session },
      );

      await this.patchManager
        .PatchCreate({
          type: "UPDATE_REQUEST",
          status: "PENDING",
          target: { id: newAnimeData.id },
          targetPath: "Anime",
          newValues: changes?.newValues,
          oldValues: changes?.oldValues,
          author: { id: this.user!.id },
        });

      DiscordWebhook.info(`Anime | Demande de modification`, `${newAnimeData.title.default} (${newAnimeData.id})`, `Utilisateur: ${this.user?.username} (${this.user?.id})`);

      return newAnimeData;
    } catch (err) {
      await this.coverManager?.deleteImageIfSaved();
      await this.bannerManager?.deleteImageIfSaved();
      throw err;
    }
  }

  public async getChanges(sourceID: string, ignoreKeys?: string[]) {
    const oldValues = await this.get(sourceID);
    const model = new AnimeModel({ ...oldValues, ...this.newData });
    await model.validate();

    const newValues = model.toJSON();

    return getChangedDataV2<IAnime>(oldValues, newValues, ignoreKeys || ["_id", "createdAt", "updatedAt"]);
  }
}
