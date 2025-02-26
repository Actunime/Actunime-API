import { DevLog } from "@actunime/utils";
import { FastifyInstance } from "fastify";
import { APIError } from "../_lib/Error";
import { APIResponse } from "../_utils/_response";
import { ZodError } from "zod";
import { hasZodFastifySchemaValidationErrors, isResponseSerializationError } from "fastify-type-provider-zod";

export const ErrorHandlerPlugin = (fastify: FastifyInstance) => {
    fastify.setErrorHandler((error, request, reply) => {
        if (error instanceof APIError) {
            DevLog(`APIError ${error.code} : ${error.message}`, 'error');
            reply.status(error.status || 500).send(new APIResponse({
                success: false,
                code: error.code,
                error: error.message,
                message: error.message,
                status: error.status
            }));
            return;
        }

        if (error instanceof ZodError) {
            DevLog(`ZodError : ${error.message}`, 'error');
            reply.status(400).send(new APIResponse({
                success: false,
                code: "BAD_REQUEST",
                error: error.message,
                message: error.message,
                status: 400
            }));
            return;
        }

        if (hasZodFastifySchemaValidationErrors(error)) {
            return reply.code(400).send(new APIResponse({
                success: false,
                code: "BAD_REQUEST",
                error: error.message,
                message: error.message,
                status: 400
            }))
        }

        if (isResponseSerializationError(error)) {
            return reply.code(500).send(new APIResponse({
                success: false,
                code: "BAD_RESPONSE",
                error: error.message,
                message: error.message,
                status: 400
            }))
        }

        DevLog(`ERREUR URL ${request.url}`, 'error');
        DevLog(`ERREUR UNHANDLED ${error.statusCode} : ${error.message}`, 'error');
        console.error(error);
        reply.status(error.statusCode || 500).send(new APIResponse({
            success: false,
            code: "SERVER_ERROR",
            error: error.message,
            message: error.message,
            status: error.statusCode || 500
        }));
    });
}