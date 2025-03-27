import { PatchPaginationBody } from '@actunime/validations';
import { useServer } from '../util';
import { APIResponse } from '../../src/_utils/_response';
import {
  IPatch,
  IPatchPaginationResponse,
  PermissionsArray,
} from '@actunime/types';
import { Server } from '../../src/_server';
import { HTTPMethods } from 'fastify';
import { Patch } from '../../src/_lib/media';

interface IRequestTest {
  method: HTTPMethods | undefined;
  path: string;
  status: number;
  data?: unknown;
}

const filter = `@patch`;
let server: Server;
const patchID = 'we9cszha';
const parseData = PatchPaginationBody.partial().parse({
  page: 1,
  query: { id: patchID },
});
const routesToSecureNoAuth: IRequestTest[] = [
  { method: 'GET', path: `/${patchID}`, status: 200 },
  { method: 'GET', path: `/${patchID}/stats`, status: 404 },
  {
    method: 'POST',
    path: '',
    status: 200,
    data: PatchPaginationBody.partial().parse({}),
  },
  {
    method: 'POST',
    path: `/${patchID}/delete`,
    status: 401,
  },
];
const fakeID = 'dqzdzq';
const routesToSecureBadData: IRequestTest[] = [
  {
    method: 'GET',
    path: `/${fakeID}`,
    status: 404,
  },
  {
    method: 'GET',
    path: `/${fakeID}/stats`,
    status: 404,
  },
  {
    method: 'POST',
    path: '',
    status: 400,
    data: { set: { target: 'true' } },
  },
  {
    method: 'POST',
    path: `/${fakeID}/delete`,
    status: 400,
    data: { set: { target: 'true' } },
  },
];
let patchsRoutes: string[];

beforeAll(async () => {
  server = await useServer();
  server.testingUser = null;
  patchsRoutes = server.routes
    .filter((a) => a.startsWith('/patchs'))
    .map((a) => a.split('/patchs')[1]);
});

describe(`${filter} @secure | patchs routes`, () => {
  it(`${filter} @secure | Vérifier qu'on s'écurise toutes les routes disponible`, async () => {
    expect(routesToSecureNoAuth.length).toBe(patchsRoutes.length);
    for (const route of routesToSecureNoAuth) {
      const find = patchsRoutes.find(
        (x) =>
          x
            .replace(':id', patchID)
            .replace(':patchID', patchID)
            .replace(':patchID', 'xyz') === route.path
      );
      if (!find) console.log(find, route.path);
      expect(find).toBeDefined();
    }
    expect(routesToSecureBadData.length).toBe(patchsRoutes.length);
    for (const route of routesToSecureBadData) {
      const find = patchsRoutes.find(
        (x) =>
          x
            .replace(':id', fakeID)
            .replace(':patchID', fakeID)
            .replace(':patchID', 'xyz') === route.path
      );
      if (!find) console.log(find, route.path);
      expect(find).toBeDefined();
    }
  });

  for (const { method, path, status, data } of routesToSecureNoAuth) {
    it(`${filter} @secure | Sans être connecté | ${path}`, async () => {
      const controller = new AbortController();
      const signal = controller.signal;
      const timeout = setTimeout(() => controller.abort(), 1000);
      const response = await server?.app.inject({
        url: `/v1/patchs${path}`,
        method: method === 'GET' ? 'GET' : 'POST',
        ...(method === 'POST'
          ? {
              headers: {
                'content-type': `application/json`,
              },
              body: JSON.stringify(data ? data : parseData),
            }
          : {}),
        signal,
      });
      clearTimeout(timeout);
      expect(response.statusCode).toBe(status);
    });
  }

  for (const { method, path, status, data } of routesToSecureBadData) {
    it(`${filter} @secure | avec des données incorrectes | ${path}`, async () => {
      server.testingUser = {
        id: `test`,
        username: `devlerito`,
        displayName: `DevLeriTo`,
        permissions: PermissionsArray.filter((x) => x.includes('REQUEST')),
      };
      const controller = new AbortController();
      const signal = controller.signal;
      const timeout = setTimeout(() => controller.abort(), 1000);
      const response = await server?.app.inject({
        url: `/v1/patchs${path}`,
        method: method === 'GET' ? 'GET' : 'POST',
        ...(method === 'POST'
          ? {
              headers: {
                'content-type': `application/json`,
              },
              body: JSON.stringify(data ? data : parseData),
            }
          : {}),
        signal,
      });
      clearTimeout(timeout);
      expect(response.statusCode).toBe(status);
    });
  }
  for (const { method, path, status, data } of routesToSecureNoAuth) {
    it(`${filter} @secure | avec des mauvaise permissions | ${path}`, async () => {
      server.testingUser = {
        id: `test`,
        username: `devlerito`,
        displayName: `DevLeriTo`,
        permissions: [`MANGA_CREATE_REQUEST`],
      };
      const controller = new AbortController();
      const signal = controller.signal;
      const timeout = setTimeout(() => controller.abort(), 1000);
      const response = await server?.app.inject({
        url: `/v1/patchs${path}`,
        method: method === 'GET' ? 'GET' : 'POST',
        ...(method === 'POST'
          ? {
              headers: {
                'content-type': `application/json`,
              },
              body: JSON.stringify(data ? data : parseData),
            }
          : {}),
        signal,
      });
      clearTimeout(timeout);
      expect(response.statusCode).toBe(status);
    });
  }
});

describe(`${filter} | Créer un patch de A-Z et vérifier sa disponibilité`, () => {
  it(`${filter} | Récupérer un patch`, async () => {
    const response = await server.app
      .inject()
      .get(`/v1/patchs/${patchID}`)
      .end();

    expect(response.statusCode).toBe(200);

    const patch: APIResponse<IPatch> = await response.json();

    expect(patch).toBeTruthy();
  });

  it(`${filter} | Rechercher un patch`, async () => {
    const response = await server.app
      .inject()
      .post(`/v1/patchs`)
      .headers({ 'Content-Type': `application/json` })
      .body(JSON.stringify(parseData))
      .end();

    expect(response.statusCode).toBe(200);

    const patch: APIResponse<IPatchPaginationResponse> = await response.json();

    expect(patch).toBeTruthy();
    console.log('results', patch.data?.results);
    expect(patch.data?.results.find((x) => x.id === patchID)).toBeTruthy();
  });

  it(`${filter} | Supprimer un patch qui est pas refusé`, async () => {
    server.testingUser = {
      id: `test`,
      username: `devlerito`,
      displayName: `DevLeriTo`,
      permissions: PermissionsArray.filter((p) => p.endsWith('REQUEST_DELETE')),
    };
    const p1 = await Patch.get(
      { status: 'PENDING' },
      {
        nullThrowErr: false,
        cache: false,
      }
    );

    expect(p1).toBeTruthy();

    const response = await server.app
      .inject()
      .post(`/v1/patchs/${p1?.id}/delete`)
      .headers({ 'Content-Type': `application/json` })
      .body(JSON.stringify({ reason: 'test' }))
      .end();

    expect(response.statusCode).toBe(403);
  });

  it(`${filter} | Supprimer un patch qui a été refusé`, async () => {
    server.testingUser = {
      id: `test`,
      username: `devlerito`,
      displayName: `DevLeriTo`,
      permissions: PermissionsArray.filter((p) => p.endsWith('REQUEST_DELETE')),
    };
    
    const p1 = await Patch.get(
      { status: 'REJECTED' },
      {
        nullThrowErr: false,
        cache: false,
      }
    );

    expect(p1).toBeTruthy();

    const response = await server.app
      .inject()
      .post(`/v1/patchs/${p1?.id}/delete`)
      .headers({ 'Content-Type': `application/json` })
      .body(JSON.stringify({ reason: 'test' }))
      .end();

    expect(response.statusCode).toBe(200);

    const deletedRes: APIResponse<IPatch> = await response.json();

    expect(deletedRes).toBeTruthy();
    expect(deletedRes.patch).toBeTruthy();
  });
});

/** END patchs/create */
