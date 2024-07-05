import { ClientSession, Document } from 'mongoose';
import { PatchModel } from '../_models';
import { IPatch } from '../_types/patchType';
import { IUser } from '../_types/userType';
import { IPatch_Pagination_ZOD } from '@/_validation/patchZOD';
import { IPaginationResponse } from '@/_types/paginationType';
import { MediaPagination } from './pagination';

class PatchManager {
  public session: ClientSession;
  public user: IUser;

  constructor(session: ClientSession, user: IUser) {
    this.user = user;
    this.session = session;
  }

  private async populate(
    doc: Document | IPaginationResponse<IPatch>,
    withMedia: IPatch_Pagination_ZOD['with']
  ) {
    if (withMedia?.actions)
      await PatchModel.populate(doc, {
        path: 'actions.user.data',
        select: '-_id',
        justOne: true,
        options: { session: this.session }
      });
    if (withMedia?.author)
      await PatchModel.populate(doc, {
        path: 'author.data',
        select: '-_id',
        justOne: true,
        options: { session: this.session }
      });
    if (withMedia?.target)
      await PatchModel.populate(doc, {
        path: 'target.data',
        select: '-_id',
        justOne: true,
        options: { session: this.session }
      });
  }

  public async get(id: string, withMedia?: IPatch_Pagination_ZOD['with']) {
    const findPatch = await PatchModel.findOne({ id }, null, { session: this.session }).select(
      '-_id'
    );

    if (!findPatch) throw new Error('Patch not found');

    if (withMedia) await this.populate(findPatch, withMedia);

    return findPatch.toJSON();
  }

  public async filter(paginationInput: IPatch_Pagination_ZOD) {
    const pagination = new MediaPagination({ model: PatchModel });

    pagination.setPagination({ page: paginationInput.page, limit: paginationInput.limit });

    const query = paginationInput.query;
    const sort = paginationInput.sort;

    if (paginationInput.strict) {
      pagination.setStrict(paginationInput.strict);
    }

    pagination.addSearchQuery([
      ...(query?.status
        ? [
            Array.isArray(query.status)
              ? { status: { $in: query.status } }
              : { status: query.status }
          ]
        : []),
      ...(query?.actionLabel ? [{ 'actions.label': query.actionLabel }] : []),
      ...(query?.actionUser ? [{ 'actions.user.id': query.actionUser }] : []),
      ...(query?.type
        ? [Array.isArray(query.type) ? { type: { $in: query.type } } : { type: query.type }]
        : []),
      ...(query?.author ? [{ 'author.id': query.author }] : []),
      ...(query?.target ? [{ 'target.id': query.target }] : []),
      ...(query?.targetPath
        ? [
            Array.isArray(query.targetPath)
              ? { targetPath: { $in: query.targetPath } }
              : { targetPath: query.targetPath }
          ]
        : []),
      ...(query?.ref ? [{ 'ref.id': query.ref }] : [])
    ]);

    if (sort) pagination.setSort(sort);

    const response = await pagination.getResults();

    if (paginationInput.with) await this.populate(response, paginationInput.with);

    return response;
  }

  async PatchCreate(args: Partial<IPatch>) {
    const newPatch = new PatchModel(args);
    await newPatch.save({ session: this.session });
  }
}

export { PatchManager };
