import { APICode } from "../_lib/Error";

export class APIResponse {
    success: boolean;
    message: string;
    code: APICode;
    error: any;
    data: any;
    status: number;
    constructor(props?: {
        success?: boolean;
        code?: APICode;
        error?: any;
        message?: string;
        data?: any;
        status?: number
    }) {
        this.code = props?.code || "OK";
        this.error = props?.error || null;
        this.success = props?.success || false;
        this.message = props?.message || "OK";
        this.data = props?.data || null;
        this.status = props?.status || 200;
    }
}