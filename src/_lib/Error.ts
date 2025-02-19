type APIErrorCode = "NOT_FOUND" | "EMPTY_CHANGES" | "BAD_ENTRY" | "FORBIDDEN" | "UNAUTHORIZED" | "BAD_REQUEST";

export class APIError extends Error {
  public status?: number;
  public code: APIErrorCode;
  constructor(message: string, code: APIErrorCode, status?: number) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
