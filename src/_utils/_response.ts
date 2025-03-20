import { APICode, codeObj } from "../_lib/Error";

export class APIResponse<T> {
  success: boolean;
  message: string;
  code: APICode;
  error: any;
  data: T | null;
  status: number;
  constructor(props?: {
    success?: boolean;
    code?: APICode;
    error?: any;
    message?: string;
    data?: T | null;
    status?: number;
  }) {
    this.code = props?.code || 'OK';
    this.error = props?.error || null;
    this.success = props?.success || false;
    this.message = props?.message || 'OK';
    this.data = props?.data || null;
    if (!props?.status && this?.code) {
      this.status = codeObj[this.code];
    } else {
      this.status = props?.status || 200;
    }
  }
}