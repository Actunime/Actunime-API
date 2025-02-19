import { ClientSession, FilterQuery, Model, PipelineStage } from "mongoose";
import { IPaginationResponse } from "@actunime/types";

export class MediaPagination<T = any> {
  public model: Model<T>;
  public session?: ClientSession;

  private page: number = 0;
  private limit: number = 20;
  private strict: boolean = false;

  public searchQuery: FilterQuery<any>[] = [];
  private sort: Record<string, 1 | -1> = {
    createdAt: -1,
  };

  private aggregation: PipelineStage[] = [];

  constructor({ model, session }: { model: Model<T>; session?: ClientSession }) {
    this.model = model;
    this.session = session;
  }

  public setPagination({ page, limit }: { page?: number; limit?: number }) {
    if (limit) this.limit = limit;

    if (page !== undefined) this.page = page;
  }

  public getByIds(ids: string[]) {
    this.searchQuery.push({
      id: { $in: ids },
    });
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
        $options: "i",
      },
    });
  }

  public addSearchQuery(query: FilterQuery<T>) {
    if (Array.isArray(query)) {
      this.searchQuery = this.searchQuery.concat(query);
    } else this.searchQuery.push(query);
  }

  public setSort(sort: Record<string, "ASC" | "DESC">) {
    const keys = Object.keys(sort);
    const formated: Record<string, 1 | -1> = Object.fromEntries(
      keys.map((key) => [key, sort[key] === "ASC" ? 1 : -1]),
    );
    this.sort = formated;
  }

  private getQuery(): FilterQuery<any> | undefined {
    const logic = this.strict ? "$and" : "$or";

    return {
      ...this.searchQuery.length ? {
        [logic]: this.searchQuery
      } : {},
      // ...!allowUnverified ? {
      //   $and: [{ isVerified: true }]
      // } : {},
    };
  }

  public async getResults(allowUnverified: boolean) {
    const query = this.getQuery();
    console.log("QUERY", query)
    const aggregation = this.aggregation;

    if (!allowUnverified)
      aggregation.push({ $match: { isVerified: true } });

    if (query)
      aggregation.push({ $match: query });

    const facet: Record<string, PipelineStage.FacetPipelineStage[]> = {
      total: [{ $count: "createdAt" }],
      results: [
        // {
        //   // On retire l'id de mongoose
        //   $unset: "_id",
        // },
        {
          $sort: this.sort,
        },
      ],
    };

    aggregation.push({ $facet: facet });
    aggregation.push({ $unwind: "$total" });

    const skip = this.skipLength();

    const project: PipelineStage.Project["$project"] = {
      page: { $literal: skip / this.limit },
      pageCount: { $ceil: { $divide: ["$total.createdAt", this.limit] } },
      pageResultsCount: {
        $size: {
          $slice: [
            "$results",
            skip,
            { $ifNull: [this.limit, "$total.createdAt"] },
          ],
        },
      },
      hasNextPage: {
        $lt: [
          { $literal: skip / this.limit + 1 },
          { $ceil: { $divide: ["$total.createdAt", this.limit] } },
        ],
      },
      hasPrevPage: { $gt: [{ $literal: skip / this.limit + 1 }, 1] },
      results: {
        $slice: [
          "$results",
          skip,
          { $ifNull: [this.limit, "$total.createdAt"] },
        ],
      },
      resultsLimit: { $literal: this.limit },
      resultsCount: "$total.createdAt",
    };

    aggregation.push({ $project: project });

    const resData: IPaginationResponse<T>[] = await this.model
      .aggregate(aggregation)
      .session(this.session || null)
      .exec();
    let response: Partial<IPaginationResponse<any>> = {
      page: this.page,
      pageCount: 1,
      pageResultsCount: 0,
      hasNextPage: false,
      hasPrevPage: false,
      results: [],
      resultsLimit: this.limit,
      resultsCount: 0,
    };
    if (Array.isArray(resData) && resData.length) {
      const data = resData[0];
      if (data) {
        response = data;
        response.results =
          response.results?.map((res) => this.model.hydrate(res).toJSON()) ||
          [];
      }
    }

    return response as IPaginationResponse<T>;
  }
}
