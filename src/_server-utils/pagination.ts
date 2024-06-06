import { IPaginationResponse } from '../_types/paginationType';
import { FilterQuery, Model, PipelineStage } from 'mongoose';

export class MediaPagination<T = any> {
  public model: Model<T>;

  private page: number = 0;
  private limit: number = 20;
  private strict: boolean = false;

  private searchQuery: FilterQuery<any>[] = [];
  private sort: Record<string, 1 | -1> = {
    createdAt: -1
  };

  constructor({ model }: { model: Model<T> }) {
    this.model = model;
  }

  public setPagination({ page, limit }: { page?: number; limit?: number }) {
    if (limit) this.limit = limit;

    if (page !== undefined) this.page = page;
  }

  private skipLength(): number {
    return this.page * this.limit;
  }

  public setStrict(strict: boolean) {
    this.strict = strict;
  }

  public searchByName(name: string, location: string) {
    this.searchQuery.push({
      [location]: {
        $regex: name,
        $options: 'i'
      }
    });
  }

  public addSearchQuery(query: FilterQuery<T>) {
    if (Array.isArray(query)) {
      this.searchQuery = this.searchQuery.concat(query);
    } else this.searchQuery.push(query);
  }

  public setSort(sort: Record<string, 'ASC' | 'DESC'>) {
    const keys = Object.keys(sort);
    const formated: Record<string, 1 | -1> = Object.fromEntries(
      keys.map((key) => [key, sort[key] === 'ASC' ? 1 : -1])
    );
    this.sort = formated;
  }

  private getQuery() {
    const logic = this.strict ? '$and' : '$or';

    if (this.searchQuery.length === 0) {
      return undefined;
    }

    return {
      [logic]: this.searchQuery
    };
  }

  public async getResults() {
    const query = this.getQuery();

    const aggregation: PipelineStage[] = [];

    if (query) aggregation.push({ $match: query });

    const facet: Record<string, PipelineStage.FacetPipelineStage[]> = {
      total: [{ $count: 'createdAt' }],
      results: [
        {
          // On retire l'id de mongoose
          $unset: '_id'
        },
        {
          $sort: this.sort
        }
      ]
    };

    aggregation.push({ $facet: facet });
    aggregation.push({ $unwind: '$total' });

    const skip = this.skipLength();

    const project: PipelineStage.Project['$project'] = {
      page: { $literal: skip / this.limit },
      pageCount: { $ceil: { $divide: ['$total.createdAt', this.limit] } },
      pageResultsCount: {
        $size: {
          $slice: ['$results', skip, { $ifNull: [this.limit, '$total.createdAt'] }]
        }
      },
      hasNextPage: {
        $lt: [
          { $literal: skip / this.limit + 1 },
          { $ceil: { $divide: ['$total.createdAt', this.limit] } }
        ]
      },
      hasPrevPage: { $gt: [{ $literal: skip / this.limit + 1 }, 1] },
      results: {
        $slice: ['$results', skip, { $ifNull: [this.limit, '$total.createdAt'] }]
      },
      resultsLimit: { $literal: this.limit },
      resultsCount: '$total.createdAt'
    };

    aggregation.push({ $project: project });

    const resData: IPaginationResponse<T>[] = await this.model.aggregate(aggregation).exec();
    let response: Partial<IPaginationResponse<any>> = object;
    if (!Array.isArray(resData) || !resData.length)
      response = {
        page: this.page,
        pageCount: 1,
        pageResultsCount: 0,
        hasNextPage: false,
        hasPrevPage: false,
        results: [],
        resultsLimit: this.limit,
        resultsCount: 0
      };
    else {
      response = resData[0];
      response.results = response.results?.map((res) => this.model.hydrate(res).toJSON()) || [];
    }

    return response as IPaginationResponse<T>;
  }
}
