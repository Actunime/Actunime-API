import { ClientSession, Document } from 'mongoose';
import { PersonModel } from '../_models';
import { IPerson } from '../_types/personType';
import { IUser } from '../_types/userType';
import {
  IAdd_Person_ZOD,
  ICreate_Person_ZOD,
  IPerson_Pagination_ZOD
} from '../_validation/personZOD';
import { PatchManager } from './patch';
import { IPatchActionList } from '../_types/patchType';
import { getChangedData } from '../_utils/getObjChangeUtil';
import { IPaginationResponse } from '@/_types/paginationType';
import { MediaPagination } from './pagination';

export class PersonManager {
  private user?: IUser;
  private session: ClientSession;
  private newData!: Partial<IPerson>;
  constructor(session: ClientSession, user?: IUser) {
    this.user = user;
    this.session = session;
  }

  private async populate(
    doc: Document | IPaginationResponse<IPerson>,
    withMedia: IPerson_Pagination_ZOD['with']
  ) {
    // if (withMedia?.actors)
    //   await PersonModel.populate(doc, { path: '', select: '-_id', justOne: true, options: { session: this.session } });
  }

  public async get(id: string, withMedia?: IPerson_Pagination_ZOD['with']) {
    const findPerson = await PersonModel.findOne({ id }, null, { session: this.session }).select(
      '-_id'
    );

    if (!findPerson) throw new Error('Person not found');

    if (withMedia) await this.populate(findPerson, withMedia);

    return findPerson.toJSON();
  }

  public async filter(paginationInput: IPerson_Pagination_ZOD) {
    const pagination = new MediaPagination({ model: PersonModel });

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

  public init(data: Partial<ICreate_Person_ZOD>) {
    this.newData = data as Partial<IPerson>;
    return this;
  }

  public async create(note?: string) {
    const newPerson = new PersonModel(this.newData);
    newPerson.isVerified = true;
    await newPerson.save({ session: this.session });

    const actions: IPatchActionList[] = [{ note, label: 'DIRECT_CREATE', user: this.user! }];

    await new PatchManager(this.session, this.user!).PatchCreate({
      type: 'CREATE',
      status: 'ACCEPTED',
      target: { id: newPerson.id },
      actions,
      targetPath: 'Person',
      changes: newPerson.toJSON(),
      beforeChanges: null,
      author: { id: this.user!.id }
    });

    return newPerson;
  }

  public async createRequest(note?: string) {
    const newPerson = new PersonModel(this.newData);

    newPerson.isVerified = false;

    // Pré-disposition d'un person qui est en cours de création.
    await newPerson.save({ session: this.session });

    const actions: IPatchActionList[] = [{ note, label: 'REQUEST', user: this.user! }];

    await new PatchManager(this.session, this.user!).PatchCreate({
      type: 'CREATE_REQUEST',
      status: 'PENDING',
      target: { id: newPerson.id },
      actions,
      targetPath: 'Person',
      changes: newPerson.toJSON(),
      beforeChanges: null,
      author: { id: this.user!.id }
    });

    return newPerson;
  }

  public async update(personID: string, note?: string) {
    const newPersonData = new PersonModel(this.newData);

    const personToUpdate = await PersonModel.findOne(
      { id: personID },
      {},
      { session: this.session }
    );

    if (!personToUpdate) throw new Error('Person not found');

    newPersonData._id = personToUpdate._id;
    newPersonData.id = personToUpdate.id;

    const changes = await getChangedData(personToUpdate.toJSON(), newPersonData, [
      '_id',
      'id',
      'createdAt',
      'updatedAt'
    ]);

    if (!changes) throw new Error('No changes found');

    await personToUpdate.updateOne({ $set: changes.newValues }, { session: this.session });

    const actions: IPatchActionList[] = [{ note, label: 'DIRECT_PATCH', user: this.user! }];

    await new PatchManager(this.session, this.user!).PatchCreate({
      type: 'UPDATE',
      status: 'ACCEPTED',
      target: { id: newPersonData.id },
      actions,
      targetPath: 'Person',
      changes: changes?.newValues,
      beforeChanges: changes?.oldValues,
      author: { id: this.user!.id }
    });

    return newPersonData;
  }

  public async updateRequest(personID: string, note?: string) {
    const newPersonData = new PersonModel(this.newData);

    const personToUpdate = await PersonModel.findOne(
      { id: personID },
      {},
      { session: this.session }
    );

    if (!personToUpdate) throw new Error('Person not found');

    newPersonData._id = personToUpdate._id;
    newPersonData.id = personToUpdate.id;

    const changes = await getChangedData(personToUpdate.toJSON(), newPersonData, [
      '_id',
      'id',
      'createdAt',
      'updatedAt'
    ]);

    if (!changes) throw new Error('No changes found');

    await personToUpdate.updateOne({ $set: changes.newValues }, { session: this.session });

    const actions: IPatchActionList[] = [{ note, label: 'REQUEST', user: this.user! }];

    await new PatchManager(this.session, this.user!).PatchCreate({
      type: 'UPDATE_REQUEST',
      status: 'PENDING',
      target: { id: newPersonData.id },
      actions,
      targetPath: 'Person',
      changes: changes?.newValues,
      beforeChanges: changes?.oldValues,
      author: { id: this.user!.id }
    });

    return newPersonData;
  }

  public async createRelation(
    relation: IAdd_Person_ZOD
  ): Promise<Omit<IAdd_Person_ZOD, 'newPerson'> & Required<Pick<IAdd_Person_ZOD, 'id'>>> {
    if (relation.newPerson) {
      const newPerson = await this.init(relation.newPerson).create();
      return { id: newPerson.id, role: relation.role };
    } else if (relation.id && (await PersonModel.exists({ id: relation.id }))) {
      return { id: relation.id };
    } else {
      throw new Error('Person invalide');
    }
  }

  public async createMultipleRelation(relations: IAdd_Person_ZOD[]) {
    const relList: Omit<IAdd_Person_ZOD, 'newPerson'> & Required<Pick<IAdd_Person_ZOD, 'id'>>[] =
      [];
    for await (const relation of relations) {
      const rel = await this.createRelation(relation);
      relList.push(rel);
    }
    return relList;
  }
}
