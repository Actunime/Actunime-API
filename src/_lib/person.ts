import { ClientSession, Document, Schema } from 'mongoose';
import { PersonModel } from '../_models';
import { IPerson } from '../_types/personType';
import { IUser } from '../_types/userType';
import {
  IAdd_Person_ZOD,
  ICreate_Person_ZOD,
  IPerson_Pagination_ZOD
} from '../_validation/personZOD';
import { PatchManager } from './patch';
import { getChangedData } from '../_utils/getObjChangeUtil';
import { MediaPagination } from './pagination';
import { ImageManager } from './image';
import { APIError } from './Error';

type DocPerson = Document<unknown, object, IPerson> &
  IPerson &
  Required<{ _id: Schema.Types.ObjectId }>;

export class PersonManager {
  private user?: IUser;
  private session: ClientSession;
  private newData!: Partial<IPerson>;
  private avatarManager?: ImageManager;
  constructor(session: ClientSession, user?: IUser) {
    this.user = user;
    this.session = session;
  }

  private async populate(doc: DocPerson, withMedia: IPerson_Pagination_ZOD['with']) {
    // await PersonModel.populate(doc, {
    //   path: 'avatar.data',
    //   select: '-_id',
    //   justOne: true,
    //   options: { session: this.session }
    // });

    // if (doc.avatar) {
    //   doc.avatar.data = ImageModel.hydrate(doc.avatar.data).toJSON();
    // }

    const imgManager = new ImageManager(this.session);

    if (doc.avatar) Object.assign(doc, { avatar: await imgManager.get(doc.avatar.id) });
  }

  public async get(id: string, withMedia?: IPerson_Pagination_ZOD['with']) {
    const findPerson = await PersonModel.findOne({ id }, null, { session: this.session }).select(
      '-_id'
    );

    if (!findPerson)
      throw new APIError('Aucune personnalité avec cet identifiant', 'NOT_FOUND', 404);

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

    if (paginationInput.with) await this.populate(response as any, paginationInput.with);

    return response;
  }

  public async init(data: Partial<ICreate_Person_ZOD>) {
    try {
      const { avatar, ...rawData } = data;
      this.newData = rawData as Partial<IPerson>;
      const { newData, user, session } = this;

      if (avatar) {
        this.avatarManager = new ImageManager(session, 'Person', user);
        newData.avatar = await this.avatarManager.createRelation(avatar);
      }

      return this;
    } catch (err) {
      await this.avatarManager?.deleteImageIfSaved();
      throw err;
    }
  }

  public async create(note?: string) {
    try {
      const newPerson = new PersonModel(this.newData);
      newPerson.isVerified = true;

      await newPerson.save({ session: this.session });
      await new PatchManager(this.session, this.user!).PatchCreate({
        type: 'CREATE',
        status: 'ACCEPTED',
        target: { id: newPerson.id },
        note,
        targetPath: 'Person',
        newValues: newPerson.toJSON(),
        oldValues: null,
        author: { id: this.user!.id }
      });

      return newPerson;
    } catch (err) {
      await this.avatarManager?.deleteImageIfSaved();
      throw err;
    }
  }

  public async createRequest(note?: string) {
    const newPerson = new PersonModel(this.newData);

    try {
      newPerson.isVerified = false;

      // Pré-disposition d'un person qui est en cours de création.
      await newPerson.save({ session: this.session });

      await new PatchManager(this.session, this.user!).PatchCreate({
        type: 'CREATE_REQUEST',
        status: 'PENDING',
        target: { id: newPerson.id },
        note,
        targetPath: 'Person',
        newValues: newPerson.toJSON(),
        oldValues: null,
        author: { id: this.user!.id }
      });

      return newPerson;
    } catch (err) {
      await this.avatarManager?.deleteImageIfSaved();
      throw err;
    }
  }

  public async update(personID: string, note?: string) {
    const newPersonData = new PersonModel(this.newData);

    try {
      const personToUpdate = await PersonModel.findOne(
        { id: personID },
        {},
        { session: this.session }
      );

      if (!personToUpdate)
        throw new APIError('Aucune personnalité avec cet identifiant', 'NOT_FOUND', 404);

      newPersonData._id = personToUpdate._id;
      newPersonData.id = personToUpdate.id;

      const changes = getChangedData(personToUpdate.toJSON(), newPersonData, [
        '_id',
        'id',
        'createdAt',
        'updatedAt'
      ]);

      if (!changes) throw new APIError("Aucun changement n'a été détecté", 'EMPTY_CHANGES', 400);

      await personToUpdate.updateOne({ $set: changes.newValues }, { session: this.session });

      await new PatchManager(this.session, this.user!).PatchCreate({
        type: 'UPDATE',
        status: 'ACCEPTED',
        target: { id: newPersonData.id },
        note,
        targetPath: 'Person',
        newValues: changes?.newValues,
        oldValues: changes?.oldValues,
        author: { id: this.user!.id }
      });

      // Suppression de lancienne image.
      if (this.avatarManager?.hasNewImage())
        await ImageManager.deleteImageFileIfExist(personToUpdate.avatar?.id, 'Person');

      return newPersonData;
    } catch (err) {
      await this.avatarManager?.deleteImageIfSaved();
      throw err;
    }
  }

  public async updateRequest(personID: string, note?: string) {
    const newPersonData = new PersonModel(this.newData);

    try {
      const personToUpdate = await PersonModel.findOne(
        { id: personID },
        {},
        { session: this.session }
      );

      if (!personToUpdate)
        throw new APIError('Aucune personnalité avec cet identifiant', 'NOT_FOUND', 404);

      newPersonData._id = personToUpdate._id;
      newPersonData.id = personToUpdate.id;

      const changes = getChangedData(personToUpdate.toJSON(), newPersonData, [
        '_id',
        'id',
        'createdAt',
        'updatedAt'
      ]);

      if (!changes) throw new APIError("Aucun changement n'a été détecté", 'EMPTY_CHANGES', 400);

      await personToUpdate.updateOne({ $set: changes.newValues }, { session: this.session });

      await new PatchManager(this.session, this.user!).PatchCreate({
        type: 'UPDATE_REQUEST',
        status: 'PENDING',
        target: { id: newPersonData.id },
        note,
        targetPath: 'Person',
        newValues: changes?.newValues,
        oldValues: changes?.oldValues,
        author: { id: this.user!.id }
      });

      return newPersonData;
    } catch (err) {
      await this.avatarManager?.deleteImageIfSaved();
      throw err;
    }
  }

  public async createRelation(
    relation: IAdd_Person_ZOD
  ): Promise<Omit<IAdd_Person_ZOD, 'newPerson'> & Required<Pick<IAdd_Person_ZOD, 'id'>>> {
    if (relation.newPerson) {
      const newPersonInit = await this.init(relation.newPerson);
      const newPerson = await newPersonInit.create();
      return { id: newPerson.id, role: relation.role };
    } else if (relation.id && (await PersonModel.exists({ id: relation.id }))) {
      return { id: relation.id };
    } else {
      throw new APIError(
        'Une relation de personnalité est invalide, il faut un identifiant ou une nouvelle personnalité.',
        'BAD_ENTRY',
        400
      );
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
