import test, { describe, it } from 'node:test';
import { AnimeCreateBody } from '@actunime/validations';
import { Server } from '../../src/_server';
import { AnimeTestData } from '..';
import assert from 'node:assert';

const parseData = AnimeCreateBody.partial({ reason: true }).parse({
  data: AnimeTestData,
  description: 'TEST',
});

const id = 'sbw8ze2t';

const UNVERIFY = async () => {
  /** Test route animes/unverify */

  await describe('Unverifier un Anime', async () => {
    await test('Unverifier un anime sans être connecté', async () => {
      const server = new Server(true);
      await server.start();

      server.testingUser = null;

      const response = await server.app
        .inject()
        .post(`/v1/animes/${id}/verify`)
        .headers({ 'Content-Type': 'application/json' })
        .body(JSON.stringify(parseData))
        .end();

      assert.strictEqual(
        response.statusCode,
        401,
        'Cela doit retourné le statut 401'
      );
    });

    await test('Unverifier un anime sans être connecté avec un identifiant incorrecte', async () => {
      const server = new Server(true);
      await server.start();

      server.testingUser = null;

      const response = await server.app
        .inject()
        .post(`/v1/animes/${'qdzqzdjqz'}/verify`)
        .headers({ 'Content-Type': 'application/json' })
        .body(JSON.stringify(parseData))
        .end();

      assert.strictEqual(
        response.statusCode,
        401,
        'Cela doit retourné le statut 401'
      );
    });

    await test('Unverifier un anime avec des données incorrectes', async () => {
      const server = new Server(true);
      await server.start();

      server.testingUser = {
        id: 'test',
        username: 'devlerito',
        displayName: 'DevLeriTo',
        roles: ['ANIME_VERIFY'],
      };

      const response = await server.app
        .inject()
        .post(`/v1/animes/${id}/verify`)
        .headers({ 'Content-Type': 'application/json' })
        .body(JSON.stringify({ tnull: 'nullos' }))
        .end();

      assert.strictEqual(
        response.statusCode,
        400,
        'Cela doit retourné le statut 400'
      );
    });

    await it('Unverifier un anime avec des données correctes', async () => {
      const server = new Server(true);
      await server.start();

      server.testingUser = {
        id: 'test',
        username: 'devlerito',
        displayName: 'DevLeriTo',
        roles: ['ANIME_VERIFY'],
      };

      const response = await server.app
        .inject()
        .post(`/v1/animes/${id}/verify`)
        .headers({ 'Content-Type': 'application/json' })
        .body(JSON.stringify({ reason: 'TEST' }))
        .end();

      assert.strictEqual(
        response.statusCode,
        200,
        'Cela doit retourné le statut 200'
      );
    });

    await it('Unverifier un anime avec des permissions incorrectes', async () => {
      const server = new Server(true);
      await server.start();

      server.testingUser = {
        id: 'test',
        username: 'devlerito',
        displayName: 'DevLeriTo',
        roles: ['ANIME_PATCH_REQUEST'],
      };

      const response = await server.app
        .inject()
        .post(`/v1/animes/${id}/verify`)
        .headers({ 'Content-Type': 'application/json' })
        .body(JSON.stringify(parseData))
        .end();

      assert.strictEqual(
        response.statusCode,
        401,
        'Cela doit retourné le statut 401'
      );
    });
  });
};

export { UNVERIFY };
