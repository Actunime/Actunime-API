import { describe, it } from 'node:test';
import { AnimeCreateBody } from '@actunime/validations';
import { Server } from '../../src/_server';
import { AnimeTestData } from '..';
import assert from 'node:assert';

const parseData = AnimeCreateBody.partial({ reason: true }).parse({
  data: AnimeTestData,
  description: 'TEST',
});

const CREATE = async () => {
  /** Test route animes/create */
  await describe('Ajouter un Anime', async () => {
    await it('Ajouter un anime sans être connecté', async () => {
      const server = new Server(true);
      await server.start();

      server.testingUser = null;

      const response = await server.app
        .inject()
        .post('/v1/animes/create')
        .headers({ 'Content-Type': 'application/json' })
        .body(JSON.stringify(parseData))
        .end();

      assert.strictEqual(
        response.statusCode,
        401,
        'Cela doit retourné le statut 401'
      );
    });

    await it('Ajouter un anime avec des données incorrectes', async () => {
      const server = new Server(true);
      await server.start();

      server.testingUser = {
        id: 'test',
        username: 'devlerito',
        displayName: 'DevLeriTo',
        roles: ['ANIME_CREATE'],
      };

      const response = await server.app
        .inject()
        .post('/v1/animes/create')
        .headers({ 'Content-Type': 'application/json' })
        .body(JSON.stringify({ tnull: 'nullos' }))
        .end();

      assert.strictEqual(
        response.statusCode,
        400,
        'Cela doit retourné le statut 400'
      );
    });

    await it('Ajouter un anime avec des données correctes', async () => {
      const server = new Server(true);
      await server.start();

      server.testingUser = {
        id: 'test',
        username: 'devlerito',
        displayName: 'DevLeriTo',
        roles: ['ANIME_CREATE'],
      };

      const response = await server.app
        .inject()
        .post('/v1/animes/create')
        .headers({ 'Content-Type': 'application/json' })
        .body(JSON.stringify(parseData))
        .end();

      assert.strictEqual(
        response.statusCode,
        200,
        'Cela doit retourné le statut 200'
      );
    });

    await it('Ajouter un anime avec des mauvaise permissions', async () => {
      const server = new Server(true);
      await server.start();

      server.testingUser = {
        id: 'test',
        username: 'devlerito',
        displayName: 'DevLeriTo',
        roles: ['ANIME_CREATE_REQUEST'],
      };

      const response = await server.app
        .inject()
        .post('/v1/animes/create')
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

  /** END animes/create */
};

export { CREATE };
