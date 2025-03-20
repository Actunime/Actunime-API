export const codeObj = {
  OK: 200,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
  EMPTY_CHANGES: 204,
  BAD_ENTRY: 400,
  FORBIDDEN: 403,
  UNAUTHORIZED: 401,
  BAD_REQUEST: 400,
  BAD_RESPONSE: 400,
  TOO_MANY_REQUESTS: 429
}


export type APICode = keyof typeof codeObj
  

export class APIError extends Error {
  public status?: number;
  public code: APICode;
  constructor(message: string, code: APICode, status?: number) {
    super(message);
    this.status = status;
    this.code = code;
    if (!status) {
      this.status = codeObj[code];
    }
  }
}
