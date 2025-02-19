import { ClientSession, Document, Schema } from "mongoose";
import { TrackModel } from "@actunime/mongoose-models";
import { ITrack, IUser, IPaginationResponse } from "@actunime/types";
import {
  ICreate_Track_ZOD,
  IAdd_Track_ZOD,
  ITrack_Pagination_ZOD,
} from "@actunime/validations";
import { PersonManager } from "./person";
import { PatchManager } from "./patch";

import { getChangedDataV2 } from "@actunime/utils";
import { MediaPagination } from "./pagination";
import { ImageManager } from "./image";
import { APIError } from "./Error";

export class TrackManager {
  private user?: IUser;
  private session: ClientSession;
  private newData!: Partial<ITrack>;
  private coverManager: ImageManager;
  private patchManager: PatchManager;
  private personManager: PersonManager;
  private isRequest?: boolean;

  constructor(session: ClientSession, options: { user?: IUser; isRequest?: boolean }) {
    this.user = options.user;
    this.session = session;
    this.isRequest = options.isRequest;
    this.coverManager = new ImageManager(session, { ...options, targetPath: "Track" });
    this.personManager = new PersonManager(session, options);
    this.patchManager = new PatchManager(session, options);
  }

  private async populate(
    doc: Document | IPaginationResponse<ITrack>,
    withMedia: ITrack_Pagination_ZOD["with"],
  ) {
    const match = { $or: [{ isVerified: this?.user?.preferences?.displayUnverifiedMedia ? { $ne: true } : true }, { isVerified: true }] };
    if (withMedia?.artists)
      await TrackModel.populate(doc, {
        path: "artists.data",
        select: "-_id",
        justOne: true,
        match,
        options: { session: this.session },
      });

    if (withMedia?.cover)
      await TrackModel.populate(doc, {
        path: "cover.data",
        select: "-_id",
        justOne: true,
        match,
        options: { session: this.session },
      });
  }

  public async get(id: string, withMedia?: ITrack_Pagination_ZOD["with"]) {
    const findTrack = await TrackModel.findOne({ id }, null, {
      session: this.session,
    }).select("-_id");

    if (!findTrack)
      throw new APIError("Aucune musique correspondante.", "NOT_FOUND", 404);

    if (withMedia) await this.populate(findTrack, withMedia);

    return findTrack.toJSON();
  }

  public async filter(paginationInput: ITrack_Pagination_ZOD) {
    const pagination = new MediaPagination({ model: TrackModel });

    pagination.setPagination({
      page: paginationInput.page,
      limit: paginationInput.limit,
    });

    const query = paginationInput.query;
    const sort = paginationInput.sort;

    if (query?.name) pagination.searchByName(query.name, "name.default");

    if (paginationInput.strict) {
      pagination.setStrict(paginationInput.strict);
    }

    if (sort) pagination.setSort(sort);

    const response = await pagination.getResults(this.user?.preferences?.displayUnverifiedMedia || query?.allowUnverified || false);

    if (paginationInput.with)
      await this.populate(response, paginationInput.with);

    return response;
  }

  public async init(data: Partial<ICreate_Track_ZOD>) {
    try {
      const {
        // Relations
        cover,
        artists,
        // Data
        ...rawData
      } = data;

      this.newData = rawData as Partial<ITrack>;

      const { newData } = this;

      if (cover) {
        newData.cover = await this.coverManager.createRelation(cover);
      }

      if (artists)
        newData.artists = await this.personManager.createMultipleRelation(artists);

      return this;
    } catch (err) {
      await this.coverManager?.deleteImageIfSaved();
      throw err;
    }
  }

  public async create(note?: string) {
    try {
      const newTrack = new TrackModel(this.newData);
      newTrack.isVerified = true;
      await newTrack.save({ session: this.session });

      await this.patchManager.PatchCreate({
        type: "CREATE",
        status: "ACCEPTED",
        target: { id: newTrack.id },
        note,
        targetPath: "Track",
        newValues: newTrack.toJSON(),
        oldValues: null,
        author: { id: this.user!.id },
      });

      return newTrack;
    } catch (err) {
      await this.coverManager?.deleteImageIfSaved();
      throw err;
    }
  }

  public async createRequest(note?: string) {
    try {
      const newTrack = new TrackModel(this.newData);

      newTrack.isVerified = false;

      // Pré-disposition d'un track qui est en cours de création.
      await newTrack.save({ session: this.session });

      await this.patchManager.PatchCreate({
        type: "CREATE_REQUEST",
        status: "PENDING",
        target: { id: newTrack.id },
        note,
        targetPath: "Track",
        newValues: newTrack.toJSON(),
        oldValues: null,
        author: { id: this.user!.id },
      });

      return newTrack;
    } catch (err) {
      await this.coverManager?.deleteImageIfSaved();
      throw err;
    }
  }

  public async patch(trackID: string, note?: string) {
    try {
      const newTrackData = new TrackModel(this.newData);

      const trackToUpdate = await TrackModel.findOne(
        { id: trackID },
        {},
        { session: this.session },
      );

      if (!trackToUpdate)
        throw new APIError("Aucune musique correspondante.", "NOT_FOUND", 404);

      newTrackData._id = trackToUpdate._id;
      newTrackData.id = trackToUpdate.id;

      const changes = getChangedDataV2(trackToUpdate.toJSON(), newTrackData, [
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

      await trackToUpdate.updateOne(
        { $set: changes.newValues },
        { session: this.session },
      );

      await this.patchManager.PatchCreate({
        type: "PATCH",
        status: "ACCEPTED",
        target: { id: newTrackData.id },
        note,
        targetPath: "Track",
        newValues: changes?.newValues,
        oldValues: changes?.oldValues,
        author: { id: this.user!.id },
      });

      if (this.coverManager?.hasNewImage())
        await ImageManager.deleteImageFileIfExist(
          trackToUpdate.cover?.id,
          "Track",
        );

      return newTrackData;
    } catch (err) {
      await this.coverManager?.deleteImageIfSaved();
      throw err;
    }
  }

  public async updateRequest(trackID: string, note?: string) {
    try {
      const newTrackData = new TrackModel(this.newData);

      const trackToUpdate = await TrackModel.findOne(
        { id: trackID },
        {},
        { session: this.session },
      );

      if (!trackToUpdate)
        throw new APIError("Aucune musique correspondante.", "NOT_FOUND", 404);

      newTrackData._id = trackToUpdate._id;
      newTrackData.id = trackToUpdate.id;

      const changes = getChangedDataV2(trackToUpdate.toJSON(), newTrackData, [
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

      await trackToUpdate.updateOne(
        { $set: changes.newValues },
        { session: this.session },
      );

      await this.patchManager.PatchCreate({
        type: "UPDATE_REQUEST",
        status: "PENDING",
        target: { id: newTrackData.id },
        note,
        targetPath: "Track",
        newValues: changes?.newValues,
        oldValues: changes?.oldValues,
        author: { id: this.user!.id },
      });

      return newTrackData;
    } catch (err) {
      await this.coverManager?.deleteImageIfSaved();
      throw err;
    }
  }

  public async createRelation(relation: IAdd_Track_ZOD) {
    if (relation.newTrack) {
      let newTrack: Document<unknown, object, ITrack> & ITrack & Required<{ _id: Schema.Types.ObjectId; }> & { __v: number; };
      const track = await this.init(relation.newTrack);
      if (this.isRequest)
        newTrack = await track.createRequest();
      else
        newTrack = await track.create();

      return { id: newTrack.id };
    } else if (relation.id && (await TrackModel.exists({ id: relation.id }))) {
      return { id: relation.id };
    } else {
      throw new APIError(
        "Relation, musique invalide, il faut un identifiant ou une nouvelle musique.",
        "BAD_ENTRY",
        400,
      );
    }
  }

  public async createMultipleRelation(relation: IAdd_Track_ZOD[]) {
    const tracks: { id: string }[] = [];
    for (const track of relation) {
      const newTrack = await this.createRelation(track);
      tracks.push(newTrack);
    }
    return tracks;
  }

  public async getChanges(sourceID: string, ignoreKeys?: string[]) {
    const oldValues = await this.get(sourceID);
    const model = new TrackModel({ ...oldValues, ...this.newData });
    await model.validate();

    const newValues = model.toJSON();

    return getChangedDataV2<ITrack>(oldValues, newValues, ignoreKeys || ["_id", "createdAt", "updatedAt"]);
  }
}
