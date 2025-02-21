export type APICode =
  "OK" |
  "NOT_FOUND" |
  "SERVER_ERROR" |
  "EMPTY_CHANGES" |
  "BAD_ENTRY" |
  "FORBIDDEN" |
  "UNAUTHORIZED" |
  "BAD_REQUEST" |
  "BAD_RESPONSE" |
  "TOO_MANY_REQUESTS";

export class APIError extends Error {
  public status?: number;
  public code: APICode;
  constructor(message: string, code: APICode, status?: number) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
