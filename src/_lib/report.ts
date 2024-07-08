import { IUser } from '@/_types/userType';
import { ClientSession, Document } from 'mongoose';
import { ReportModel } from '../_models';
import { IReport, IReportCreateProps } from '../_types/reportType';
import { IPaginationResponse } from '@/_types/paginationType';
import { ICreate_Report_ZOD, IReport_Pagination_ZOD } from '@/_validation/reportZOD';
import { MediaPagination } from './pagination';
import { ActivityManager } from './activity';
import { getChangedData } from '@/_utils/getObjChangeUtil';
import { IPatchActionList } from '@/_types/patchType';
import { PatchManager } from './patch';

export class ReportManager {
  public session: ClientSession;
  public user: IUser;
  private newData!: Partial<IReport>;


  constructor(session: ClientSession, user: IUser) {
    this.user = user;
    this.session = session;
  }

  private async populate(
    doc: Document | IPaginationResponse<IReport>,
    withMedia: IReport_Pagination_ZOD['with']
  ) {
    if (withMedia?.author)
      await ReportModel.populate(doc, {
        path: 'author.data',
        select: '-_id',
        justOne: true,
        options: { session: this.session }
      });
    if (withMedia?.target)
      await ReportModel.populate(doc, {
        path: 'target.data',
        select: '-_id',
        justOne: true,
        options: { session: this.session }
      });
  }

  public async get(id: string, withMedia?: IReport_Pagination_ZOD['with']) {
    const findReport = await ReportModel.findOne({ id }, null, {
      session: this.session
    }).select('-_id');

    if (!findReport) throw new Error('Report not found');

    if (withMedia) await this.populate(findReport, withMedia);

    return findReport.toJSON();
  }

  public async filter(paginationInput: IReport_Pagination_ZOD) {
    const pagination = new MediaPagination({ model: ReportModel });

    pagination.setPagination({ page: paginationInput.page, limit: paginationInput.limit });

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
      ...(query?.targetPath ? [{ targetPath: query.targetPath }] : [])
    ]);

    if (sort) pagination.setSort(sort);

    const response = await pagination.getResults();

    if (paginationInput.with) await this.populate(response, paginationInput.with);

    return response;
  }

  public async CreateReport(props: IReportCreateProps) {
    const newReport = new ReportModel({
      ...props
    });

    await newReport.validate();
    const saved = await newReport.save({ validateBeforeSave: false });

    await new ActivityManager(this.session, this.user).CreateActivity(
      'MODERATION',
      'CREATE_REPORT',
      {
        author: props.author,
        target: props.target,
        targetPath: 'User'
      }
    );

    return saved;
  }

  public init(data: Partial<ICreate_Report_ZOD>) {
    this.newData = data;

    return this;
  }

  public async update(reportID: string, note?: string) {
    const newReportData = new ReportModel(this.newData);

    const reportToUpdate = await ReportModel.findOne(
      { id: reportID },
      {},
      { session: this.session }
    );

    if (!reportToUpdate) throw new Error('Report not found');

    newReportData._id = reportToUpdate._id;
    newReportData.id = reportToUpdate.id;

    const changes = await getChangedData(reportToUpdate.toJSON(), newReportData, [
      '_id',
      'id',
      'createdAt',
      'updatedAt'
    ]);

    if (!changes) throw new Error('No changes found');

    await reportToUpdate.updateOne({ $set: changes.newValues }, { session: this.session });

    const actions: IPatchActionList[] = [{ note, label: 'DIRECT_PATCH', user: this.user! }];

    await new PatchManager(this.session, this.user!).PatchCreate({
      type: 'UPDATE',
      status: 'ACCEPTED',
      target: { id: newReportData.id },
      actions,
      targetPath: 'Report',
      changes: changes?.newValues,
      beforeChanges: changes?.oldValues,
      author: { id: this.user!.id }
    });

    return newReportData;
  }
}
