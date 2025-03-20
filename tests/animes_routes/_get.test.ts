import { describe, it } from 'node:test';
import { Server } from '../../src/_server';
import assert from 'node:assert';

const id = 'sbw8ze2t';

const GET = async () => {
  await describe('Récupérer un Anime', async () => {
    await it('Récupérer un anime', async () => {
      const server = new Server(true);
      await server.start();

      server.testingUser = null;

      const response = await server.app.inject().get(`/v1/animes/${id}`).end();

      assert.strictEqual(
        response.statusCode,
        200,
        'Cela doit retourné le statut 200'
      );
    });
    await it('Récupérer un anime inexistant', async () => {
      const server = new Server(true);
      await server.start();

      server.testingUser = null;

      const response = await server.app
        .inject()
        .get(`/v1/animes/${'dqzdzqdqz'}`)
        .end();

      assert.strictEqual(
        response.statusCode,
        404,
        'Cela doit retourné le statut 404'
      );
    });
  });
};

export { GET };
