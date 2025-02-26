import { FastifyInstance } from "fastify";

const JSONParserPlugin = (fastify: FastifyInstance) => {
    fastify.addContentTypeParser('application/json', { parseAs: 'string' }, function (req, body: string, done) {
        try {
            const json = JSON.parse(body)
            done(null, json)
        } catch (err) {
            const error = err as any;
            error.statusCode = 400
            done(error, undefined)
        }
    })
}

export { JSONParserPlugin }