import { ClientSession, Document, Schema } from "mongoose";
import { IGroupe, IUser } from "@actunime/types";
import {
  ICreate_Groupe_ZOD,
  IGroupe_Pagination_ZOD,
} from "@actunime/validations";
import { PatchManager } from "./patch";
import { GroupeModel } from "@actunime/mongoose-models";
import { getChangedDataV2 } from "@actunime/utils";
import { MediaPagination } from "./pagination";
import { APIError } from "./Error";

export class GroupeManager {
  private user?: IUser;
  private session: ClientSession;
  private newData!: Partial<IGroupe>;
  private isRequest?: boolean
  private patchManager: PatchManager

  constructor(session: ClientSession, options: { user?: IUser, isRequest?: boolean }) {
    this.user = options.user;
    this.session = session;
    this.isRequest = options.isRequest;
    this.patchManager = new PatchManager(session, options);
  }

  // private async populate(
  //   doc: Document | IPaginationResponse<IGroupe>,
  //   withMedia: IGroupe_Pagination_ZOD["with"],
  // ) {
  //   // if (withMedia?.actors)
  //   //     await doc.populate({ path: 'actors.data', select: '-_id', justOne: true, options: { session: this.session } });
  // }

  public async get(id: string, withMedia?: IGroupe_Pagination_ZOD["with"]) {
    const findGroupe = await GroupeModel.findOne({ id }, null, {
      session: this.session,
    }).select("-_id");

    if (!findGroupe)
      throw new APIError("Aucun groupe avec cet identifiant", "NOT_FOUND", 404);

    if (withMedia) {
      // await this.populate(findGroupe, withMedia);
    }

    return findGroupe.toJSON();
  }

  public async filter(paginationInput: IGroupe_Pagination_ZOD) {
    const pagination = new MediaPagination({ model: GroupeModel });

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

    if (paginationInput.with) {
      // await this.populate(response, paginationInput.with);
    }

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

    await this.patchManager.PatchCreate({
      type: "CREATE",
      status: "ACCEPTED",
      target: { id: newGroupe.id },
      note,
      targetPath: "Groupe",
      newValues: newGroupe.toJSON(),
      oldValues: null,
      author: { id: this.user!.id },
    });

    return newGroupe;
  }

  public async createRequest(note?: string) {
    const newGroupe = new GroupeModel(this.newData);

    newGroupe.isVerified = false;

    // Pré-disposition d'un groupe qui est en cours de création.
    await newGroupe.save({ session: this.session });

    await this.patchManager.PatchCreate({
      type: "CREATE_REQUEST",
      status: "PENDING",
      target: { id: newGroupe.id },
      note,
      targetPath: "Groupe",
      newValues: newGroupe.toJSON(),
      oldValues: null,
      author: { id: this.user!.id },
    });

    return newGroupe;
  }

  public async patch(groupeID: string, note?: string) {
    const newGroupeData = new GroupeModel(this.newData);

    const groupeToUpdate = await GroupeModel.findOne(
      { id: groupeID },
      {},
      { session: this.session },
    );

    if (!groupeToUpdate)
      throw new APIError("Aucun groupe avec cet identifiant", "NOT_FOUND", 404);

    newGroupeData._id = groupeToUpdate._id;
    newGroupeData.id = groupeToUpdate.id;

    const changes = getChangedDataV2(
      groupeToUpdate.toJSON(),
      newGroupeData,
      ["_id", "id", "createdAt", "updatedAt"],
    );

    if (!changes?.newValues)
      throw new APIError(
        "Aucun changement n'a été détecté",
        "EMPTY_CHANGES",
        400,
      );

    await groupeToUpdate.updateOne(
      { $set: changes.newValues },
      { session: this.session },
    );

    await this.patchManager.PatchCreate({
      type: "PATCH",
      status: "ACCEPTED",
      target: { id: newGroupeData.id },
      note,
      targetPath: "Groupe",
      newValues: changes?.newValues,
      oldValues: changes?.oldValues,
      author: { id: this.user!.id },
    });

    return newGroupeData;
  }

  public async updateRequest(groupeID: string, note?: string) {
    const newGroupeData = new GroupeModel(this.newData);

    const groupeToUpdate = await GroupeModel.findOne(
      { id: groupeID },
      {},
      { session: this.session },
    );

    if (!groupeToUpdate)
      throw new APIError("Aucun groupe avec cet identifiant", "NOT_FOUND", 404);

    newGroupeData._id = groupeToUpdate._id;
    newGroupeData.id = groupeToUpdate.id;

    const changes = getChangedDataV2(
      groupeToUpdate.toJSON(),
      newGroupeData,
      ["_id", "id", "createdAt", "updatedAt"],
    );

    if (!changes?.newValues)
      throw new APIError(
        "Aucun changement n'a été détecté",
        "EMPTY_CHANGES",
        400,
      );

    await groupeToUpdate.updateOne(
      { $set: changes.newValues },
      { session: this.session },
    );

    await this.patchManager.PatchCreate({
      type: "UPDATE_REQUEST",
      status: "PENDING",
      target: { id: newGroupeData.id },
      note,
      targetPath: "Groupe",
      newValues: changes?.newValues,
      oldValues: changes?.oldValues,
      author: { id: this.user!.id },
    });

    return newGroupeData;
  }

  public async createRelation(relation: {
    id?: string;
    newGroupe?: ICreate_Groupe_ZOD;
  }) {
    if (relation.newGroupe) {

      let newGroupe: Document<unknown, object, IGroupe> & IGroupe & Required<{ _id: Schema.Types.ObjectId; }> & { __v: number; };

      const groupe = this.init(relation.newGroupe);

      if (this.isRequest)
        newGroupe = await groupe.createRequest();
      else newGroupe = await groupe.create();

      return { id: newGroupe.id };
    } else if (relation.id && (await GroupeModel.exists({ id: relation.id }))) {
      return { id: relation.id };
    } else {
      throw new Error("Groupe invalide");
    }
  }

  public async getChanges(sourceID: string, ignoreKeys?: string[]) {
    const oldValues = await this.get(sourceID);
    const model = new GroupeModel({ ...oldValues, ...this.newData });
    await model.validate();

    const newValues = model.toJSON();

    return getChangedDataV2<IGroupe>(oldValues, newValues, ignoreKeys || ["_id", "createdAt", "updatedAt"]);
  }
}
