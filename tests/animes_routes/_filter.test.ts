import { describe, it } from 'node:test';
import {
  AnimePaginationBody,
  IAnimePaginationBody,
} from '@actunime/validations';
import { Server } from '../../src/_server';
import assert from 'node:assert';
import { IAnimePaginationResponse } from '@actunime/types/_animeType';
import { APIResponse } from '../../src/_utils/_response';

const FILTER = async () => {
  await describe('Rechercher un Anime', async () => {
    await it('Rechercher un anime par nom', async () => {
      const server = new Server(true);
      await server.start();

      server.testingUser = null;

      await it('Rechercher un anime par nom existant', async () => {
        const pagination: Partial<IAnimePaginationBody> = {
          query: {
            title: {
              default: 'Izure Saikyou',
            },
          },
        };

        const response = await server.app
          .inject()
          .post(`/v1/animes`)
          .headers({ 'Content-Type': 'application/json' })
          .body(JSON.stringify(AnimePaginationBody.partial().parse(pagination)))
          .end();

        assert.strictEqual(
          response.statusCode,
          200,
          'Cela doit retourné le statut 200'
        );

        const { data } =
          response.json() as APIResponse<IAnimePaginationResponse>;

        assert.ok(data !== undefined, 'Le resultat doit pas être non défini');
        assert.ok(data !== null, 'Le resultat doit pas être non défini');

        assert.ok(
          data?.results?.length !== undefined,
          'Le resultat doit avoir des données'
        );

        assert.ok(
          data?.results[0]?.title?.default?.includes('Izure Saikyou'),
          'Le premier résultat doit inclure le nom de la recherche'
        );
      });

      await it('Rechercher un anime par nom non existant', async () => {
        const pagination: Partial<IAnimePaginationBody> = {
          query: {
            title: {
              default: 'qdkqozdqzd zq5d4qz564d65464',
            },
          },
        };

        const response = await server.app
          .inject()
          .post(`/v1/animes`)
          .headers({ 'Content-Type': 'application/json' })
          .body(JSON.stringify(AnimePaginationBody.partial().parse(pagination)))
          .end();

        assert.strictEqual(
          response.statusCode,
          200,
          'Cela doit retourné le statut 200'
        );

        const { data } =
          response.json() as APIResponse<IAnimePaginationResponse>;

        assert.ok(data !== undefined, 'Le resultat doit pas être non défini');
        assert.ok(data !== null, 'Le resultat doit pas être non défini');

        assert.ok(
          data?.results?.length !== undefined,
          'Le resultat doit pas être non défini'
        );

        assert.ok(
          data?.results?.length === 0,
          'Le resultat doit pas avoir des données'
        );
      });

      await it('Rechercher un anime par nom existant a la mauvaise page', async () => {
        const pagination: Partial<IAnimePaginationBody> = {
          page: 2,
          query: {
            title: {
              default: 'Izure Saikyou',
            },
          },
        };

        const response = await server.app
          .inject()
          .post(`/v1/animes`)
          .headers({ 'Content-Type': 'application/json' })
          .body(JSON.stringify(AnimePaginationBody.partial().parse(pagination)))
          .end();

        assert.strictEqual(
          response.statusCode,
          200,
          'Cela doit retourné le statut 200'
        );

        const { data } =
          response.json() as APIResponse<IAnimePaginationResponse>;

        assert.ok(data !== undefined, 'Le resultat doit pas être non défini');
        assert.ok(data !== null, 'Le resultat doit pas être non défini');

        assert.ok(
          data?.results?.length !== undefined,
          'Le resultat doit pas être non défini'
        );

        assert.ok(
          data?.results?.length === 0,
          'Le resultat doit pas avoir des données'
        );
      });
    });
  });
};

export { FILTER };
