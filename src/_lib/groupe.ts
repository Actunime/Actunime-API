import { ClientSession, Document } from 'mongoose';
import { IGroupe } from '../_types/groupeType';
import { IUser } from '../_types/userType';
import { ICreate_Groupe_ZOD, IGroupe_Pagination_ZOD } from '../_validation/groupeZOD';
import { PatchManager } from './patch';
import { GroupeModel } from '../_models';

import { getChangedData } from '../_utils/getObjChangeUtil';
import { IPaginationResponse } from '@/_types/paginationType';
import { MediaPagination } from './pagination';

export class GroupeManager {
  private user?: IUser;
  private session: ClientSession;
  private newData!: Partial<IGroupe>;

  constructor(session: ClientSession, user?: IUser) {
    this.user = user;
    this.session = session;
  }

  private async populate(
    doc: Document | IPaginationResponse<IGroupe>,
    withMedia: IGroupe_Pagination_ZOD['with']
  ) {
    // if (withMedia?.actors)
    //     await doc.populate({ path: 'actors.data', select: '-_id', justOne: true, options: { session: this.session } });
  }

  public async get(id: string, withMedia?: IGroupe_Pagination_ZOD['with']) {
    const findGroupe = await GroupeModel.findOne({ id }, null, { session: this.session }).select(
      '-_id'
    );

    if (!findGroupe) throw new Error('Groupe not found');

    if (withMedia) await this.populate(findGroupe, withMedia);

    return findGroupe.toJSON();
  }

  public async filter(paginationInput: IGroupe_Pagination_ZOD) {
    const pagination = new MediaPagination({ model: GroupeModel });

    pagination.setPagination({ page: paginationInput.page, limit: paginationInput.limit });

    const query = paginationInput.query;
    const sort = paginationInput.sort;

    if (query?.name) pagination.searchByName(query.name, 'name');

    if (paginationInput.strict) {
      pagination.setStrict(paginationInput.strict);
    }

    if (sort) pagination.setSort(sort);

    const response = await pagination.getResults();

    if (paginationInput.with) await this.populate(response, paginationInput.with);

    return response;
  }

  public init(data: Partial<ICreate_Groupe_ZOD>) {
    const rawData = data;
    this.newData = rawData as Partial<IGroupe>;
    return this;
  }

  public async create(note?: string) {
    const newGroupe = new GroupeModel(this.newData);
    newGroupe.isVerified = true;
    await newGroupe.save({ session: this.session });



    await new PatchManager(this.session, this.user!).PatchCreate({
      type: 'CREATE',
      status: 'ACCEPTED',
      target: { id: newGroupe.id },
      note,
      targetPath: 'Groupe',
      newValues: newGroupe.toJSON(),
      oldValues: null,
      author: { id: this.user!.id }
    });

    return newGroupe;
  }

  public async createRequest(note?: string) {
    const newGroupe = new GroupeModel(this.newData);

    newGroupe.isVerified = false;

    // Pré-disposition d'un groupe qui est en cours de création.
    await newGroupe.save({ session: this.session });


    await new PatchManager(this.session, this.user!).PatchCreate({
      type: 'CREATE_REQUEST',
      status: 'PENDING',
      target: { id: newGroupe.id },
      note,
      targetPath: 'Groupe',
      newValues: newGroupe.toJSON(),
      oldValues: null,
      author: { id: this.user!.id }
    });

    return newGroupe;
  }

  public async update(groupeID: string, note?: string) {
    const newGroupeData = new GroupeModel(this.newData);

    const groupeToUpdate = await GroupeModel.findOne(
      { id: groupeID },
      {},
      { session: this.session }
    );

    if (!groupeToUpdate) throw new Error('Groupe not found');

    newGroupeData._id = groupeToUpdate._id;
    newGroupeData.id = groupeToUpdate.id;

    const changes = await getChangedData(groupeToUpdate.toJSON(), newGroupeData, [
      '_id',
      'id',
      'createdAt',
      'updatedAt'
    ]);

    if (!changes) throw new Error('No changes found');

    await groupeToUpdate.updateOne({ $set: changes.newValues }, { session: this.session });


    await new PatchManager(this.session, this.user!).PatchCreate({
      type: 'UPDATE',
      status: 'ACCEPTED',
      target: { id: newGroupeData.id },
      note,
      targetPath: 'Groupe',
      newValues: changes?.newValues,
      oldValues: changes?.oldValues,
      author: { id: this.user!.id }
    });

    return newGroupeData;
  }

  public async updateRequest(groupeID: string, note?: string) {
    const newGroupeData = new GroupeModel(this.newData);

    const groupeToUpdate = await GroupeModel.findOne(
      { id: groupeID },
      {},
      { session: this.session }
    );

    if (!groupeToUpdate) throw new Error('Groupe not found');

    newGroupeData._id = groupeToUpdate._id;
    newGroupeData.id = groupeToUpdate.id;

    const changes = await getChangedData(groupeToUpdate.toJSON(), newGroupeData, [
      '_id',
      'id',
      'createdAt',
      'updatedAt'
    ]);

    if (!changes) throw new Error('No changes found');

    await groupeToUpdate.updateOne({ $set: changes.newValues }, { session: this.session });


    await new PatchManager(this.session, this.user!).PatchCreate({
      type: 'UPDATE_REQUEST',
      status: 'PENDING',
      target: { id: newGroupeData.id },
      note,
      targetPath: 'Groupe',
      newValues: changes?.newValues,
      oldValues: changes?.oldValues,
      author: { id: this.user!.id }
    });

    return newGroupeData;
  }

  public async createRelation(relation: { id?: string; newGroupe?: ICreate_Groupe_ZOD }) {
    if (relation.newGroupe) {
      const newGroupe = await this.init(relation.newGroupe).create();
      return { id: newGroupe.id };
    } else if (relation.id && (await GroupeModel.exists({ id: relation.id }))) {
      return { id: relation.id };
    } else {
      throw new Error('Groupe invalide');
    }
  }
}
