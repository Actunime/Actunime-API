export interface IPaginationResponse<T> {
  page: number;
  pageCount: number;
  pageResultsCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  results: T[];
  resultsLimit: number;
  resultsCount: number;
}