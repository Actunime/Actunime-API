import { AnimeCreateBody, AnimePaginationBody } from '@actunime/validations';
import { AnimeCreateData } from '../mock/anime';
import { useServer } from '../util';
import { APIResponse } from '../../src/_utils/_response';
import { IAnime } from '@actunime/types';
import { AnimeEqualTEST } from '../utilTest';
import { Server } from '../../src/_server';
import { HTTPMethods } from 'fastify';

const parseData = AnimeCreateBody.partial({ reason: true }).parse({
  data: AnimeCreateData,
  description: `TEST`,
});
const filter = `@anime @create`;
let server: Server;
const animeID = 'sbw8ze2t';
const routesToSecure: {
  method: HTTPMethods | undefined;
  path: string;
  status: number;
  data?: any;
}[] = [
  { method: 'GET', path: `/${animeID}`, status: 200 },
  { method: 'GET', path: `/${animeID}/stats`, status: 404 },
  {
    method: 'POST',
    path: '',
    status: 200,
    data: AnimePaginationBody.partial().parse({}),
  },
  { method: 'POST', path: '/create', status: 401 },
  { method: 'POST', path: `/${animeID}/update`, status: 401 },
  { method: 'POST', path: `/${animeID}/delete`, status: 401 },
  { method: 'POST', path: `/${animeID}/verify`, status: 401 },
  { method: 'POST', path: `/${animeID}/unverify`, status: 401 },
  { method: 'POST', path: `/requests/create`, status: 401 },
  { method: 'POST', path: `/${animeID}/requests`, status: 401 },
  {
    method: 'POST',
    path: `/${animeID}/requests/create`,
    status: 401,
  },
  {
    method: 'POST',
    path: `/${animeID}/requests/xyz/update`,
    status: 401,
  },
  {
    method: 'POST',
    path: `/${animeID}/requests/xyz/accept`,
    status: 401,
  },
  {
    method: 'POST',
    path: `/${animeID}/requests/xyz/reject`,
    status: 401,
  },
  {
    method: 'POST',
    path: `/${animeID}/requests/xyz/delete`,
    status: 401,
  },
];
let animesRoutes: string[];

beforeAll(async () => {
  server = await useServer();
  server.testingUser = null;
  animesRoutes = server.routes
    .filter((a) => a.startsWith('/animes'))
    .map((a) => a.split('/animes')[1]);
});

describe(`${filter} @secure | animes routes`, () => {
  it(`${filter} @secure | Vérifier qu'on s'écurise toutes les routes disponible`, async () => {
    expect(routesToSecure.length).toBe(animesRoutes.length);
    for (const route of routesToSecure) {
      const find = animesRoutes.find(
        (x) =>
          x
            .replace(':id', animeID)
            .replace(':animeID', animeID)
            .replace(':patchID', 'xyz') === route.path
      );
      if (!find) console.log(find, route.path);
      expect(find).toBeDefined();
    }
  });

  for (const { method, path, status, data } of routesToSecure) {
    it(`${filter} @secure | Sans être connecté | ${path}`, async () => {
      const response = await server?.app.inject({
        url: `/v1/animes${path}`,
        method: method === 'GET' ? 'GET' : 'POST',
        ...(method === 'POST'
          ? {
              headers: {
                'content-type': `application/json`,
              },
              body: JSON.stringify(data ? data : parseData),
            }
          : {}),
      });
      expect(response.statusCode).toBe(status);
    });
  }

  it(`${filter} @secure | avec des données incorrectes`, async () => {
    server.testingUser = {
      id: `test`,
      username: `devlerito`,
      displayName: `DevLeriTo`,
      roles: [`ANIME_CREATE`],
    };

    const response = await server.app
      .inject()
      .post(`/v1/animes/create`)
      .headers({ 'Content-Type': `application/json` })
      .body(JSON.stringify({ tnull: `nullos` }))
      .end();

    expect(response.statusCode).toBe(400);
  });
  it(`${filter} @secure | avec des mauvaise permissions`, async () => {
    server.testingUser = {
      id: `test`,
      username: `devlerito`,
      displayName: `DevLeriTo`,
      roles: [`ANIME_CREATE_REQUEST`],
    };

    const response = await server.app
      .inject()
      .post(`/v1/animes/create`)
      .headers({ 'Content-Type': `application/json` })
      .body(JSON.stringify(parseData))
      .end();

    expect(response.statusCode).toBe(401);
  });
});
describe(`${filter} | Créer un anime de A-Z et vérifier sa disponibilité`, () => {
  let server: Server;
  let data: APIResponse<IAnime>;
  it(`${filter} | Créer un anime`, async () => {
    server = await useServer();
    server.testingUser = {
      id: `test`,
      username: `devlerito`,
      displayName: `DevLeriTo`,
      roles: [`ANIME_CREATE`],
    };

    const response = await server.app
      .inject()
      .post(`/v1/animes/create`)
      .headers({ 'Content-Type': `application/json` })
      .body(JSON.stringify(parseData))
      .end();

    expect(response.statusCode).toBe(200);

    data = await response.json();

    expect(data).toBeDefined();
    expect(data.data?.isVerified).toBe(true);
  });

  it(`${filter} | Vérifier que l'anime envoyé correspond a l'anime retourné`, async () => {
    await AnimeEqualTEST(data.data, parseData.data);
  });

  it(`${filter} | Récupérer l'anime crée`, async () => {
    expect(data).toBeDefined();

    const response = await server.app
      .inject()
      .get(`/v1/animes/${data.data?.id}`)
      .end();

    expect(response.statusCode).toBe(200);

    const anime: APIResponse<IAnime> = await response.json();

    expect(anime).toBeDefined();
    expect(anime.data?.isVerified).toBe(true);

    await AnimeEqualTEST(anime.data, parseData.data);
  });

  it(`${filter} | Vérifier l'anime`, async () => {
    const response = await server.app
      .inject()
      .post(`/v1/animes/create`)
      .headers({ 'Content-Type': `application/json` })
      .body(JSON.stringify(parseData))
      .end();

    expect(response.statusCode).toBe(200);

    data = await response.json();

    expect(data).toBeDefined();
    expect(data.data?.isVerified).toBe(true);
  });
});

/** END animes/create */
