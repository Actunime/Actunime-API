import { FastifyInstance } from 'fastify';
import { APIError } from '../_lib/error';

const JSONParserPlugin = (fastify: FastifyInstance) => {
  fastify.addContentTypeParser(
    'application/json',
    { parseAs: 'string' },
    function (_req, body: string, done) {
      try {
        const json = JSON.parse(body);
        done(null, json);
      } catch (err) {
        if (err) done(new APIError(err?.toString(), 'BAD_REQUEST'), undefined);
        else done(new APIError('Invalide JSON', 'BAD_REQUEST'), undefined);
      }
    }
  );
};

export { JSONParserPlugin };
