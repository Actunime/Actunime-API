import {
  IUser,
  IActivity,
  IActivityCreateProps,
  IActivityAction,
  IActivityType,
  IPaginationResponse,
} from "@actunime/types";
import { ClientSession, Document } from "mongoose";
import { ActivityModel } from "@actunime/mongoose-models";
import { IActivity_Pagination_ZOD } from "@actunime/validations";
import { MediaPagination } from "./pagination";

export class ActivityManager {
  public session: ClientSession;
  public user?: IUser;

  constructor(session: ClientSession, options: { user?: IUser }) {
    this.user = options.user;
    this.session = session;
  }

  private async populate(
    doc: Document | IPaginationResponse<IActivity>,
    withMedia: IActivity_Pagination_ZOD["with"],
  ) {
    if (withMedia?.author)
      await ActivityModel.populate(doc, {
        path: "author.data",
        select: "-_id",
        justOne: true,
        options: { session: this.session },
      });
    if (withMedia?.target)
      await ActivityModel.populate(doc, {
        path: "target.data",
        select: "-_id",
        justOne: true,
        options: { session: this.session },
      });
  }

  public async get(id: string, withMedia?: IActivity_Pagination_ZOD["with"]) {
    const findActivity = await ActivityModel.findOne({ id }, null, {
      session: this.session,
    }).select("-_id");

    if (!findActivity) throw new Error("Activity not found");

    if (withMedia) await this.populate(findActivity, withMedia);

    return findActivity.toJSON();
  }

  public async filter(paginationInput: IActivity_Pagination_ZOD) {
    const pagination = new MediaPagination({ model: ActivityModel });

    pagination.setPagination({
      page: paginationInput.page,
      limit: paginationInput.limit,
    });

    const query = paginationInput.query;
    const sort = paginationInput.sort;

    if (paginationInput.strict) {
      pagination.setStrict(paginationInput.strict);
    }

    pagination.addSearchQuery([
      ...(query?.type ? [{ type: query.type }] : []),
      ...(query?.action ? [{ action: query.action }] : []),
      ...(query?.author ? [{ "author.id": query.author }] : []),
      ...(query?.target ? [{ "target.id": query.target }] : []),
      ...(query?.targetPath ? [{ targetPath: query.targetPath }] : []),
    ]);

    if (sort) pagination.setSort(sort);

    const response = await pagination.getResults(true);

    if (paginationInput.with)
      await this.populate(response, paginationInput.with);

    return response;
  }

  public async CreateActivity(
    type: IActivityType,
    action: IActivityAction,
    props: Omit<IActivityCreateProps, "type" | "action">,
  ) {
    if (!type) throw new Error("Type not found");
    if (!action) throw new Error("Action not found");

    const newActivity = new ActivityModel({
      ...props,
      type,
      action,
    });

    await newActivity.validate();
    const saved = await newActivity.save({ validateBeforeSave: false });

    return saved;
  }
}
