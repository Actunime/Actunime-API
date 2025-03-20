import {
  ClientSession,
  Document,
  FilterQuery,
  Model,
  PipelineStage,
  Schema,
} from 'mongoose';
import { IPaginationResponse } from '@actunime/types';
import { PaginationBody } from '@actunime/validations';
import { z } from 'zod';
import { flatten } from 'flat';
import { APIError } from '../_lib/Error';
import { ModelDoc } from '../_lib/models';

type IPaginationModelDoc<T> = Model<ModelDoc<T>>;

class Pagination<T> {
  private model: IPaginationModelDoc<T>;
  private session: ClientSession | null = null;

  private aggregation: PipelineStage[] = [];
  private query: FilterQuery<T>[] = [];
  private sort: Partial<Record<keyof T, number>> | { createdAt: number } = {
    createdAt: -1,
  };

  private strict: boolean = false;
  private verifiedOnly: boolean = true;

  private page: number = 0;
  private limit: number = 20;

  constructor(model: IPaginationModelDoc<T>) {
    this.model = model;
  }

  public useSession(session: ClientSession) {
    this.session = session;
    return this;
  }

  public useFilter(
    filter: Partial<z.infer<typeof PaginationBody>> | undefined
  ) {
    const { page, limit, strict, sort, query, onlyVerified } = filter || {};

    if (page) this.setPage(page);
    if (limit) this.setLimit(limit);
    if (strict !== undefined) this.setStrict(strict);
    if (sort) this.setSort(sort);
    if (query) this.addQuery(query);
    if (onlyVerified !== undefined) this.setVerifiedOnly(onlyVerified);
  }

  public setPage(page: number) {
    this.page = page < 1 ? 0 : page - 1;
    return this;
  }

  public setLimit(limit: number) {
    this.limit = limit;
    return this;
  }

  public setSort(sort: Partial<Record<keyof T, number>>) {
    this.sort = sort;
    return this;
  }

  public setStrict(strict: boolean) {
    this.strict = strict;
    return this;
  }

  public setVerifiedOnly(verified: boolean) {
    this.verifiedOnly = verified;
    return this;
  }

  public addQuery(query: FilterQuery<T>) {
    this.query.push(query);
    return this;
  }

  public addAggregation(aggregation: PipelineStage) {
    this.aggregation.push(aggregation);
    return this;
  }

  private skip() {
    return this.page * this.limit;
  }

  private getProject() {
    const skip = this.skip();
    const project: PipelineStage.Project['$project'] = {
      page: { $literal: skip / this.limit },
      pageCount: { $ceil: { $divide: ['$total.createdAt', this.limit] } },
      pageResultsCount: {
        $size: {
          $slice: [
            '$results',
            skip,
            { $ifNull: [this.limit, '$total.createdAt'] },
          ],
        },
      },
      hasNextPage: {
        $lt: [
          { $literal: skip / this.limit + 1 },
          { $ceil: { $divide: ['$total.createdAt', this.limit] } },
        ],
      },
      hasPrevPage: { $gt: [{ $literal: skip / this.limit + 1 }, 1] },
      results: {
        $slice: [
          '$results',
          skip,
          { $ifNull: [this.limit, '$total.createdAt'] },
        ],
      },
      resultsLimit: { $literal: this.limit },
      resultsCount: '$total.createdAt',
    };

    return project;
  }

  private regexInclude(value: string | object) {
    if (this.strict) return value;

    if (typeof value === 'object') {
      const toRegex = {};
      for (const key of Object.keys(value)) {
        if (typeof value[key] === 'string') {
          toRegex[key] = new RegExp(value[key], 'i');
        }
      }
      return toRegex;
    }

    return new RegExp(value, 'i');
  }

  // Passe les string[] en { $in: string[] };
  // Passe les obj en "key.key: value"
  private parseObj(obj: object, forSort: boolean = false) {
    const parsedObj: object = {};
    const objB: object = {};

    for (const key of Object.keys(obj)) {
      const value = obj[key];
      if (Array.isArray(value)) {
        if (forSort)
          throw new APIError(
            "La pagination n'accepte pas de tableau pour sort",
            'BAD_ENTRY'
          );
        const hasObject = value.some((v) => typeof v === 'object');
        if (hasObject)
          throw new APIError(
            "La pagination n'accepte pas de tableau contenant un objet, revoir le schema de validation!",
            'BAD_ENTRY'
          );
        parsedObj[key] = { $in: value };
        continue;
      }
      objB[key] = forSort ? value : this.regexInclude(value);
    }

    Object.assign(parsedObj, flatten(objB));

    return parsedObj;
  }

  private parseSort() {
    const parsedObj = this.parseObj(this.sort, true);

    for (const value of Object.values(parsedObj)) {
      if (value !== 1 && value !== -1)
        throw new APIError(
          'sort utilise que des valeurs de 1 ou -1',
          'BAD_ENTRY'
        );
    }

    this.sort = parsedObj;
  }

  private parseQuery() {
    const parsedQuerys: FilterQuery<T>[] = [];
    for (let i = 0; i < this.query.length; i++) {
      const query = this.query[i];
      const parsedQuery = this.parseObj(query);
      parsedQuerys.push(parsedQuery);
    }

    this.query = parsedQuerys;
  }

  private getFinalAggregation() {
    this.parseQuery();
    this.parseSort();
    for (const query of this.query) {
      if (this.strict) {
        for (const key of Object.keys(query)) {
          this.addAggregation({
            $match: { [key]: query[key] },
          });
        }
        continue;
      }
      this.addAggregation({ $match: query });
    }

    if (this.verifiedOnly)
      this.addAggregation({ $match: { isVerified: true } });

    const facet: Record<string, PipelineStage.FacetPipelineStage[]> = {
      total: [{ $count: 'createdAt' }],
      results: [{ $sort: this.sort as Record<string, 1 | -1> }],
    };

    this.aggregation.push({ $facet: facet });
    this.aggregation.push({ $unwind: '$total' });
    this.aggregation.push({ $project: this.getProject() });

    console.log(this.aggregation[0]);
  }

  private emptyResponse(): IPaginationResponse<T> {
    return {
      page: this.page + 1,
      pageCount: 1,
      pageResultsCount: 0,
      hasNextPage: false,
      hasPrevPage: false,
      results: [],
      resultsLimit: this.limit,
      resultsCount: 0,
    };
  }

  public async getResults(): Promise<IPaginationResponse<T>> {
    this.getFinalAggregation();
    const res = await this.model
      .aggregate(this.aggregation)
      .session(this.session);

    const data = res?.[0];
    if (data) data.page = this.page + 1;
    return data || this.emptyResponse();
  }
}

export { Pagination as PaginationControllers };
