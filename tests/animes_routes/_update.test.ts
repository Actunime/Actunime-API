import test, { describe, it } from 'node:test';
import { AnimeCreateBody, AnimeDataToZOD } from '@actunime/validations';
import { Server } from '../../src/_server';
import { AnimeTestData } from '..';
import assert from 'node:assert';
import { Anime } from '../../src/_lib/anime';

const parseData = AnimeCreateBody.partial({ reason: true }).parse({
  data: AnimeTestData,
  description: 'TEST',
});
const id = 'sbw8ze2t';

const UPDATE = async () => {
  /** Test route animes/update */

  await describe('Modifier un Anime', async () => {
    await test('Modifier un anime sans être connecté', async () => {
      const server = new Server(true);
      await server.start();

      server.testingUser = null;

      const response = await server.app
        .inject()
        .post(`/v1/animes/${id}/update`)
        .headers({ 'Content-Type': 'application/json' })
        .body(JSON.stringify(parseData))
        .end();

      assert.strictEqual(
        response.statusCode,
        401,
        'Cela doit retourné le statut 401'
      );
    });

    await test('Modifier un anime sans être connecté avec un identifiant incorrecte', async () => {
      const server = new Server(true);
      await server.start();

      server.testingUser = null;

      const response = await server.app
        .inject()
        .post(`/v1/animes/${'qdzqzdjqz'}/update`)
        .headers({ 'Content-Type': 'application/json' })
        .body(JSON.stringify(parseData))
        .end();

      assert.strictEqual(
        response.statusCode,
        401,
        'Cela doit retourné le statut 401'
      );
    });

    await test('Modifier un anime avec des données incorrectes', async () => {
      const server = new Server(true);
      await server.start();

      server.testingUser = {
        id: 'test',
        username: 'devlerito',
        displayName: 'DevLeriTo',
        roles: ['ANIME_PATCH'],
      };

      const response = await server.app
        .inject()
        .post(`/v1/animes/${id}/update`)
        .headers({ 'Content-Type': 'application/json' })
        .body(JSON.stringify({ tnull: 'nullos' }))
        .end();

      assert.strictEqual(
        response.statusCode,
        400,
        'Cela doit retourné le statut 400'
      );
    });

    await it('Modifier un anime avec des données correctes', async () => {
      const server = new Server(true);
      await server.start();

      server.testingUser = {
        id: 'test',
        username: 'devlerito',
        displayName: 'DevLeriTo',
        roles: ['ANIME_PATCH'],
      };

      const response = await server.app
        .inject()
        .post(`/v1/animes/${id}/update`)
        .headers({ 'Content-Type': 'application/json' })
        .body(JSON.stringify(parseData))
        .end();

      assert.strictEqual(
        response.statusCode,
        200,
        'Cela doit retourné le statut 200'
      );
    });

    await it('Modifier un anime avec des permissions incorrectes', async () => {
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
        .post(`/v1/animes/${id}/update`)
        .headers({ 'Content-Type': 'application/json' })
        .body(JSON.stringify(parseData))
        .end();

      assert.strictEqual(
        response.statusCode,
        401,
        'Cela doit retourné le statut 401'
      );
    });

    await it('Modifier un anime sans apporter de modification', async () => {
      const server = new Server(true);
      await server.start();

      server.testingUser = {
        id: 'test',
        username: 'devlerito',
        displayName: 'DevLeriTo',
        roles: ['ANIME_PATCH'],
      };

      const original = await Anime.get(id, {
        nullThrowErr: true,
        cache: false,
      });
      const toZOD = AnimeCreateBody.parse(AnimeDataToZOD(original));

      const response = await server.app
        .inject()
        .post(`/v1/animes/${id}/update`)
        .headers({ 'Content-Type': 'application/json' })
        .body(JSON.stringify(toZOD))
        .end();

      assert.equal(
        response.statusCode,
        204,
        'Cela doit retourné le statut 204'
      );
    });
  });
};

export { UPDATE };
