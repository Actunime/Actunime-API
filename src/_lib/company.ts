import { ClientSession, Document, Schema } from "mongoose";
import { IUser, ICompany, IPaginationResponse } from "@actunime/types";
import {
  ICompany_Pagination_ZOD,
  ICreate_Company_ZOD,
} from "@actunime/validations";
import { CompanyModel } from "@actunime/mongoose-models";

import { PatchManager } from "./patch";
import { getChangedDataV2 } from "@actunime/utils";
import { MediaPagination } from "./pagination";
import { ImageManager } from "./image";
import { APIError } from "./Error";

export class CompanyManager {
  private session: ClientSession;
  private user?: IUser;
  private newData!: Partial<ICompany>;
  private logoManager: ImageManager;
  private patchManager: PatchManager
  private isRequest?: boolean

  constructor(session: ClientSession, options: { user?: IUser, isRequest?: boolean }) {
    this.user = options.user;
    this.session = session;
    this.isRequest = options.isRequest;
    this.logoManager = new ImageManager(session, { ...options, targetPath: "Company" });
    this.patchManager = new PatchManager(session, options);
  }

  private async populate(
    doc: Document | IPaginationResponse<ICompany>,
    withMedia: ICompany_Pagination_ZOD["with"],
  ) { }

  public async get(id: string, withMedia?: ICompany_Pagination_ZOD["with"]) {
    const findCompany = await CompanyModel.findOne({ id }, null, {
      session: this.session,
    }).select("-_id");

    if (!findCompany)
      throw new APIError(
        "Aucune société avec cet identifiant",
        "NOT_FOUND",
        404,
      );

    if (withMedia) await this.populate(findCompany, withMedia);

    return findCompany.toJSON();
  }

  public async filter(paginationInput: ICompany_Pagination_ZOD) {
    const pagination = new MediaPagination({ model: CompanyModel });

    pagination.setPagination({
      page: paginationInput.page,
      limit: paginationInput.limit,
    });

    const query = paginationInput.query;
    const sort = paginationInput.sort;

    if (query?.name) pagination.searchByName(query.name, "name");

    if (paginationInput.strict) {
      pagination.setStrict(paginationInput.strict);
    }

    if (sort) pagination.setSort(sort);

    const response = await pagination.getResults(this.user?.preferences?.displayUnverifiedMedia || query?.allowUnverified || false);

    if (paginationInput.with)
      await this.populate(response, paginationInput.with);

    return response;
  }

  public async init(data: Partial<ICreate_Company_ZOD>) {
    try {
      const { logo, ...rawData } = data;

      this.newData = rawData as Partial<IUser>;

      const { newData } = this;

      if (logo) {
        newData.logo = await this.logoManager.createRelation(logo);
      }

      return this;
    } catch (err) {
      await this.logoManager?.deleteImageIfSaved();
      throw err;
    }
  }

  public async create(note?: string) {
    try {
      const newCompany = new CompanyModel(this.newData);
      newCompany.isVerified = true;
      await newCompany.save({ session: this.session });

      await this.patchManager.PatchCreate({
        type: "CREATE",
        status: "ACCEPTED",
        target: { id: newCompany.id },
        note,
        targetPath: "Company",
        newValues: newCompany.toJSON(),
        oldValues: null,
        author: { id: this.user!.id },
      });

      return newCompany;
    } catch (err) {
      await this.logoManager?.deleteImageIfSaved();
      throw err;
    }
  }

  public async createRequest(note?: string) {
    try {
      const newCompany = new CompanyModel(this.newData);

      newCompany.isVerified = false;

      // Pré-disposition d'un company qui est en cours de création.
      await newCompany.save({ session: this.session });

      await this.patchManager.PatchCreate({
        type: "CREATE_REQUEST",
        status: "PENDING",
        target: { id: newCompany.id },
        note,
        targetPath: "Company",
        newValues: newCompany.toJSON(),
        oldValues: null,
        author: { id: this.user!.id },
      });

      return newCompany;
    } catch (err) {
      await this.logoManager?.deleteImageIfSaved();
      throw err;
    }
  }

  public async patch(companyID: string, note?: string) {
    try {
      const newCompanyData = new CompanyModel(this.newData);

      const companyToUpdate = await CompanyModel.findOne(
        { id: companyID },
        {},
        { session: this.session },
      );

      if (!companyToUpdate)
        throw new APIError(
          "Aucune société avec cet identifiant",
          "NOT_FOUND",
          404,
        );

      newCompanyData._id = companyToUpdate._id;
      newCompanyData.id = companyToUpdate.id;

      const changes = getChangedDataV2(companyToUpdate.toJSON(), newCompanyData, [
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

      await companyToUpdate.updateOne(
        { $set: changes.newValues },
        { session: this.session },
      );

      await this.patchManager.PatchCreate({
        type: "PATCH",
        status: "ACCEPTED",
        target: { id: newCompanyData.id },
        note,
        targetPath: "Company",
        newValues: changes?.newValues,
        oldValues: changes?.oldValues,
        author: { id: this.user!.id },
      });

      if (this.logoManager?.hasNewImage())
        await this.logoManager.deleteImageFile(companyToUpdate.logo?.id);

      return newCompanyData;
    } catch (err) {
      await this.logoManager?.deleteImageIfSaved();
      throw err;
    }
  }

  public async updateRequest(companyID: string, note?: string) {
    try {
      const newCompanyData = new CompanyModel(this.newData);

      const companyToUpdate = await CompanyModel.findOne(
        { id: companyID },
        {},
        { session: this.session },
      );

      if (!companyToUpdate)
        throw new APIError(
          "Aucune société avec cet identifiant",
          "NOT_FOUND",
          404,
        );

      newCompanyData._id = companyToUpdate._id;
      newCompanyData.id = companyToUpdate.id;

      const changes = getChangedDataV2(companyToUpdate.toJSON(), newCompanyData, [
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

      await companyToUpdate.updateOne(
        { $set: changes.newValues },
        { session: this.session },
      );

      await this.patchManager.PatchCreate({
        type: "UPDATE_REQUEST",
        status: "PENDING",
        target: { id: newCompanyData.id },
        note,
        targetPath: "Company",
        newValues: changes?.newValues,
        oldValues: changes?.oldValues,
        author: { id: this.user!.id },
      });

      return newCompanyData;
    } catch (err) {
      await this.logoManager?.deleteImageIfSaved();
      throw err;
    }
  }

  public async createRelation(relation: {
    id?: string;
    newCompany?: ICreate_Company_ZOD;
  }) {
    if (relation.newCompany) {
      let newCompany: Document<unknown, object, ICompany> & ICompany & Required<{ _id: Schema.Types.ObjectId; }> & { __v: number; };
      const company = await this.init(relation.newCompany);
      if (this.isRequest)
        newCompany = await company.createRequest();
      else
        newCompany = await company.create();

      return { id: newCompany.id };

    } else if (
      relation.id &&
      (await CompanyModel.exists({ id: relation.id }))
    ) {
      return { id: relation.id };
    } else {
      throw new Error("Company invalide");
    }
  }

  public async createMultipleRelation(
    relations: { id?: string; newCompany?: ICreate_Company_ZOD }[],
  ) {
    const relList: { id: string }[] = [];
    for await (const relation of relations) {
      const rel = await this.createRelation(relation);
      relList.push(rel);
    }
    return relList;
  }

  public async getChanges(sourceID: string, ignoreKeys?: string[]) {
    const oldValues = await this.get(sourceID);
    const model = new CompanyModel({ ...oldValues, ...this.newData });
    await model.validate();

    const newValues = model.toJSON();

    return getChangedDataV2<ICompany>(oldValues, newValues, ignoreKeys || ["_id", "createdAt", "updatedAt"]);
  }
}
