import { ClientSession, Document } from 'mongoose';
import { TrackModel } from '../_models';
import { ITrack } from '../_types/trackType';
import { IUser } from '../_types/userType';
import { ICreate_Track_ZOD, IAdd_Track_ZOD, ITrack_Pagination_ZOD } from '../_validation/trackZOD';
import { PersonManager } from './person';
import { PatchManager } from './patch';
import { IPatchActionList } from '../_types/patchType';
import { getChangedData } from '../_utils/getObjChangeUtil';
import { IPaginationResponse } from '@/_types/paginationType';
import { MediaPagination } from './pagination';

export class TrackManager {
  private user?: IUser;
  private session: ClientSession;
  private newData!: Partial<ITrack>;
  constructor(session: ClientSession, user?: IUser) {
    this.user = user;
    this.session = session;
  }

  private async populate(
    doc: Document | IPaginationResponse<ITrack>,
    withMedia: ITrack_Pagination_ZOD['with']
  ) {
    if (withMedia?.artists)
      await TrackModel.populate(doc, {
        path: 'artists.data',
        select: '-_id',
        justOne: true,
        options: { session: this.session }
      });
  }

  public async get(id: string, withMedia?: ITrack_Pagination_ZOD['with']) {
    const findTrack = await TrackModel.findOne({ id }, null, { session: this.session }).select(
      '-_id'
    );

    if (!findTrack) throw new Error('Track not found');

    if (withMedia) await this.populate(findTrack, withMedia);

    return findTrack.toJSON();
  }

  public async filter(paginationInput: ITrack_Pagination_ZOD) {
    const pagination = new MediaPagination({ model: TrackModel });

    pagination.setPagination({ page: paginationInput.page, limit: paginationInput.limit });

    const query = paginationInput.query;
    const sort = paginationInput.sort;

    if (query?.name) pagination.searchByName(query.name, 'name.default');

    if (paginationInput.strict) {
      pagination.setStrict(paginationInput.strict);
    }

    if (sort) pagination.setSort(sort);

    const response = await pagination.getResults();

    if (paginationInput.with) await this.populate(response, paginationInput.with);

    return response;
  }

  public async init(data: Partial<ICreate_Track_ZOD>) {
    const {
      // Relations
      artists,
      // Data
      ...rawData
    } = data;

    this.newData = rawData as Partial<ITrack>;

    const { newData, user, session } = this;

    if (artists)
      newData.artists = await new PersonManager(session, user).createMultipleRelation(artists);

    return this;
  }

  public async create(note?: string) {
    const newTrack = new TrackModel(this.newData);
    newTrack.isVerified = true;
    await newTrack.save({ session: this.session });

    const actions: IPatchActionList[] = [{ note, label: 'DIRECT_CREATE', user: this.user! }];

    await new PatchManager(this.session, this.user!).PatchCreate({
      type: 'CREATE',
      status: 'ACCEPTED',
      target: { id: newTrack.id },
      actions,
      targetPath: 'Track',
      changes: newTrack.toJSON(),
      beforeChanges: null,
      author: { id: this.user!.id }
    });

    return newTrack;
  }

  public async createRequest(note?: string) {
    const newTrack = new TrackModel(this.newData);

    newTrack.isVerified = false;

    // Pré-disposition d'un track qui est en cours de création.
    await newTrack.save({ session: this.session });

    const actions: IPatchActionList[] = [{ note, label: 'REQUEST', user: this.user! }];

    await new PatchManager(this.session, this.user!).PatchCreate({
      type: 'CREATE_REQUEST',
      status: 'PENDING',
      target: { id: newTrack.id },
      actions,
      targetPath: 'Track',
      changes: newTrack.toJSON(),
      beforeChanges: null,
      author: { id: this.user!.id }
    });

    return newTrack;
  }

  public async update(trackID: string, note?: string) {
    const newTrackData = new TrackModel(this.newData);

    const trackToUpdate = await TrackModel.findOne({ id: trackID }, {}, { session: this.session });

    if (!trackToUpdate) throw new Error('Track not found');

    newTrackData._id = trackToUpdate._id;
    newTrackData.id = trackToUpdate.id;

    const changes = await getChangedData(trackToUpdate.toJSON(), newTrackData, [
      '_id',
      'id',
      'createdAt',
      'updatedAt'
    ]);

    if (!changes) throw new Error('No changes found');

    await trackToUpdate.updateOne({ $set: changes.newValues }, { session: this.session });

    const actions: IPatchActionList[] = [{ note, label: 'DIRECT_PATCH', user: this.user! }];

    await new PatchManager(this.session, this.user!).PatchCreate({
      type: 'UPDATE',
      status: 'ACCEPTED',
      target: { id: newTrackData.id },
      actions,
      targetPath: 'Track',
      changes: changes?.newValues,
      beforeChanges: changes?.oldValues,
      author: { id: this.user!.id }
    });

    return newTrackData;
  }

  public async updateRequest(trackID: string, note?: string) {
    const newTrackData = new TrackModel(this.newData);

    const trackToUpdate = await TrackModel.findOne({ id: trackID }, {}, { session: this.session });

    if (!trackToUpdate) throw new Error('Track not found');

    newTrackData._id = trackToUpdate._id;
    newTrackData.id = trackToUpdate.id;

    const changes = await getChangedData(trackToUpdate.toJSON(), newTrackData, [
      '_id',
      'id',
      'createdAt',
      'updatedAt'
    ]);

    if (!changes) throw new Error('No changes found');

    await trackToUpdate.updateOne({ $set: changes.newValues }, { session: this.session });

    const actions: IPatchActionList[] = [{ note, label: 'REQUEST', user: this.user! }];

    await new PatchManager(this.session, this.user!).PatchCreate({
      type: 'UPDATE_REQUEST',
      status: 'PENDING',
      target: { id: newTrackData.id },
      actions,
      targetPath: 'Track',
      changes: changes?.newValues,
      beforeChanges: changes?.oldValues,
      author: { id: this.user!.id }
    });

    return newTrackData;
  }

  public async createRelation(relation: IAdd_Track_ZOD) {
    if (relation.newTrack) {
      const initTrack = await this.init(relation.newTrack);
      const newTrack = await initTrack.create();
      return { id: newTrack.id };
    } else if (relation.id && (await TrackModel.exists({ id: relation.id }))) {
      return { id: relation.id };
    } else {
      throw new Error('Track invalide');
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
}
