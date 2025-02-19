import {
  IUser,
  IReport,
  IReportCreateProps,
  IPaginationResponse,
} from "@actunime/types";
import { ClientSession, Document } from "mongoose";
import { ReportModel } from "@actunime/mongoose-models";
import {
  ICreate_Report_ZOD,
  IReport_Pagination_ZOD,
} from "@actunime/validations";
import { MediaPagination } from "./pagination";
import { ActivityManager } from "./activity";
import { getChangedDataV2 } from "@actunime/utils";
import { PatchManager } from "./patch";

export class ReportManager {
  public session: ClientSession;
  public user: IUser;
  private newData!: Partial<IReport>;
  private patchManager: PatchManager;
  private activityManager: ActivityManager;

  constructor(session: ClientSession, options: { user: IUser }) {
    this.user = options.user;
    this.session = session;
    this.patchManager = new PatchManager(session, options);
    this.activityManager = new ActivityManager(session, options);
  }

  private async populate(
    doc: Document | IPaginationResponse<IReport>,
    withMedia: IReport_Pagination_ZOD["with"],
  ) {
    if (withMedia?.author)
      await ReportModel.populate(doc, {
        path: "author.data",
        select: "-_id",
        justOne: true,
        options: { session: this.session },
      });
    if (withMedia?.target)
      await ReportModel.populate(doc, {
        path: "target.data",
        select: "-_id",
        justOne: true,
        options: { session: this.session },
      });
  }

  public async get(id: string, withMedia?: IReport_Pagination_ZOD["with"]) {
    const findReport = await ReportModel.findOne({ id }, null, {
      session: this.session,
    }).select("-_id");

    if (!findReport) throw new Error("Report not found");

    if (withMedia) await this.populate(findReport, withMedia);

    return findReport.toJSON();
  }

  public async filter(paginationInput: IReport_Pagination_ZOD) {
    const pagination = new MediaPagination({ model: ReportModel });

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
      ...(query?.status ? [{ status: query.status }] : []),
      ...(query?.by ? [{ by: query.by }] : []),
      ...(query?.author ? [{ author: query.author }] : []),
      ...(query?.target ? [{ target: query.target }] : []),
      ...(query?.targetPath ? [{ targetPath: query.targetPath }] : []),
    ]);

    if (sort) pagination.setSort(sort);

    const response = await pagination.getResults(true);

    if (paginationInput.with)
      await this.populate(response, paginationInput.with);

    return response;
  }

  public async CreateReport(props: IReportCreateProps) {
    const newReport = new ReportModel({
      ...props,
    });

    await newReport.validate();
    const saved = await newReport.save({ validateBeforeSave: false });

    await this.activityManager.CreateActivity(
      "MODERATION",
      "CREATE_REPORT",
      {
        author: props.author,
        target: props.target,
        targetPath: "User",
      },
    );

    return saved;
  }

  public init(data: Partial<ICreate_Report_ZOD>) {
    this.newData = data;

    return this;
  }

  public async patch(reportID: string, note?: string) {
    const newReportData = new ReportModel(this.newData);

    const reportToUpdate = await ReportModel.findOne(
      { id: reportID },
      {},
      { session: this.session },
    );

    if (!reportToUpdate) throw new Error("Report not found");

    newReportData._id = reportToUpdate._id;
    newReportData.id = reportToUpdate.id;

    const changes = await getChangedDataV2(
      reportToUpdate.toJSON(),
      newReportData,
      ["_id", "id", "createdAt", "updatedAt"],
    );

    if (!changes?.newValues) throw new Error("No changes found");

    await reportToUpdate.updateOne(
      { $set: changes.newValues },
      { session: this.session },
    );

    await this.patchManager.PatchCreate({
      type: "PATCH",
      status: "ACCEPTED",
      target: { id: newReportData.id },
      note,
      targetPath: "Report",
      newValues: changes?.newValues,
      oldValues: changes?.oldValues,
      author: { id: this.user!.id },
    });

    return newReportData;
  }
}
