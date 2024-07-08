import { ClientSession, Document } from 'mongoose';
import { IUser } from '../_types/userType';
import { ICompany } from '../_types/companyType';
import { ICompany_Pagination_ZOD, ICreate_Company_ZOD } from '../_validation/companyZOD';
import { CompanyModel } from '../_models';
import { IPatchActionList } from '../_types/patchType';
import { PatchManager } from './patch';
import { getChangedData } from '../_utils/getObjChangeUtil';
import { IPaginationResponse } from '@/_types/paginationType';
import { MediaPagination } from './pagination';
import { ImageManager } from './image';

export class CompanyManager {
  private session: ClientSession;
  private user?: IUser;
  private newData!: Partial<ICompany>;

  constructor(session: ClientSession, user?: IUser) {
    this.user = user;
    this.session = session;
  }

  private async populate(
    doc: Document | IPaginationResponse<ICompany>,
    withMedia: ICompany_Pagination_ZOD['with']
  ) { }

  public async get(id: string, withMedia?: ICompany_Pagination_ZOD['with']) {
    const findCompany = await CompanyModel.findOne({ id }, null, { session: this.session }).select(
      '-_id'
    );

    if (!findCompany) throw new Error('Company not found');

    if (withMedia) await this.populate(findCompany, withMedia);

    return findCompany.toJSON();
  }

  public async filter(paginationInput: ICompany_Pagination_ZOD) {
    const pagination = new MediaPagination({ model: CompanyModel });

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

  public async init(data: Partial<ICreate_Company_ZOD>) {
    const { images, ...rawData } = data;

    this.newData = rawData as Partial<IUser>;

    const { newData, user, session } = this;

    if (images)
      newData.images = await new ImageManager(session, 'User', user)
        .createMultipleRelation(images);

    return this;
  }

  public async create(note?: string) {
    const newCompany = new CompanyModel(this.newData);
    newCompany.isVerified = true;
    await newCompany.save({ session: this.session });

    const actions: IPatchActionList[] = [{ note, label: 'DIRECT_CREATE', user: this.user! }];

    await new PatchManager(this.session, this.user!).PatchCreate({
      type: 'CREATE',
      status: 'ACCEPTED',
      target: { id: newCompany.id },
      actions,
      targetPath: 'Company',
      changes: newCompany.toJSON(),
      beforeChanges: null,
      author: { id: this.user!.id }
    });

    return newCompany;
  }

  public async createRequest(note?: string) {
    const newCompany = new CompanyModel(this.newData);

    newCompany.isVerified = false;

    // Pré-disposition d'un company qui est en cours de création.
    await newCompany.save({ session: this.session });

    const actions: IPatchActionList[] = [{ note, label: 'REQUEST', user: this.user! }];

    await new PatchManager(this.session, this.user!).PatchCreate({
      type: 'CREATE_REQUEST',
      status: 'PENDING',
      target: { id: newCompany.id },
      actions,
      targetPath: 'Company',
      changes: newCompany.toJSON(),
      beforeChanges: null,
      author: { id: this.user!.id }
    });

    return newCompany;
  }

  public async update(companyID: string, note?: string) {
    const newCompanyData = new CompanyModel(this.newData);

    const companyToUpdate = await CompanyModel.findOne(
      { id: companyID },
      {},
      { session: this.session }
    );

    if (!companyToUpdate) throw new Error('Company not found');

    newCompanyData._id = companyToUpdate._id;
    newCompanyData.id = companyToUpdate.id;

    const changes = await getChangedData(companyToUpdate.toJSON(), newCompanyData, [
      '_id',
      'id',
      'createdAt',
      'updatedAt'
    ]);

    if (!changes) throw new Error('No changes found');

    await companyToUpdate.updateOne({ $set: changes.newValues }, { session: this.session });

    const actions: IPatchActionList[] = [{ note, label: 'DIRECT_PATCH', user: this.user! }];

    await new PatchManager(this.session, this.user!).PatchCreate({
      type: 'UPDATE',
      status: 'ACCEPTED',
      target: { id: newCompanyData.id },
      actions,
      targetPath: 'Company',
      changes: changes?.newValues,
      beforeChanges: changes?.oldValues,
      author: { id: this.user!.id }
    });

    return newCompanyData;
  }

  public async updateRequest(companyID: string, note?: string) {
    const newCompanyData = new CompanyModel(this.newData);

    const companyToUpdate = await CompanyModel.findOne(
      { id: companyID },
      {},
      { session: this.session }
    );

    if (!companyToUpdate) throw new Error('Company not found');

    newCompanyData._id = companyToUpdate._id;
    newCompanyData.id = companyToUpdate.id;

    const changes = await getChangedData(companyToUpdate.toJSON(), newCompanyData, [
      '_id',
      'id',
      'createdAt',
      'updatedAt'
    ]);

    if (!changes) throw new Error('No changes found');

    await companyToUpdate.updateOne({ $set: changes.newValues }, { session: this.session });

    const actions: IPatchActionList[] = [{ note, label: 'REQUEST', user: this.user! }];

    await new PatchManager(this.session, this.user!).PatchCreate({
      type: 'UPDATE_REQUEST',
      status: 'PENDING',
      target: { id: newCompanyData.id },
      actions,
      targetPath: 'Company',
      changes: changes?.newValues,
      beforeChanges: changes?.oldValues,
      author: { id: this.user!.id }
    });

    return newCompanyData;
  }

  public async createRelation(relation: { id?: string; newCompany?: ICreate_Company_ZOD }) {
    if (relation.newCompany) {
      const newCompanyInit = await this.init(relation.newCompany);
      const newCompany = await newCompanyInit.create();
      return { id: newCompany.id };
    } else if (relation.id && (await CompanyModel.exists({ id: relation.id }))) {
      return { id: relation.id };
    } else {
      throw new Error('Company invalide');
    }
  }

  public async createMultipleRelation(
    relations: { id?: string; newCompany?: ICreate_Company_ZOD }[]
  ) {
    const relList: { id: string }[] = [];
    for await (const relation of relations) {
      const rel = await this.createRelation(relation);
      relList.push(rel);
    }
    return relList;
  }
}
