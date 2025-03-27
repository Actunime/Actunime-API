import {
  AnimeCreateBody,
  AnimeDataToZOD,
  AnimePaginationBody,
  MediaVerifyBody,
  PaginationBody,
} from '@actunime/validations';
import { AnimeCreateData } from '../mock/anime';
import { useServer } from '../util';
import { APIResponse } from '../../src/_utils/_response';
import { IAnime, IPatch, PermissionsArray } from '@actunime/types';
import { AnimeEqualTEST } from '../utilTest';
import { Server } from '../../src/_server';
import { HTTPMethods } from 'fastify';
import { Anime, Patch } from '../../src/_lib/media';

interface IRequestTest {
  method: HTTPMethods | undefined;
  path: string;
  status: number;
  data?: unknown;
}
const parseData = AnimeCreateBody.partial({ reason: true }).parse({
  data: AnimeCreateData,
  description: `TEST`,
});
const filter = `@anime @create`;
let server: Server;
const animeID = 'sbw8ze2t';
const routesToSecureNoAuth: IRequestTest[] = [
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
  {
    method: 'POST',
    path: `/${animeID}/requests`,
    status: 401,
    data: PaginationBody.partial().parse({ page: 1 }),
  },
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
  }
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
    path: '/create',
    status: 400,
    data: { set: { target: 'true' } },
  },
  {
    method: 'POST',
    path: `/${fakeID}/update`,
    status: 400,
    data: { set: { target: 'true' } },
  },
  {
    method: 'POST',
    path: `/${fakeID}/delete`,
    status: 400,
    data: { set: { target: 'true' } },
  },
  {
    method: 'POST',
    path: `/${fakeID}/verify`,
    status: 400,
    data: { set: { target: 'true' } },
  },
  {
    method: 'POST',
    path: `/${fakeID}/unverify`,
    status: 400,
    data: { set: { target: 'true' } },
  },
  {
    method: 'POST',
    path: `/requests/create`,
    status: 400,
    data: { set: { target: 'true' } },
  },
  {
    method: 'POST',
    path: `/${fakeID}/requests`,
    status: 400,
    data: { set: { target: 'true' } },
  },
  {
    method: 'POST',
    path: `/${fakeID}/requests/create`,
    status: 400,
    data: { set: { target: 'true' } },
  },
  {
    method: 'POST',
    path: `/${fakeID}/requests/xyz/update`,
    status: 400,
    data: { set: { target: 'true' } },
  },
  {
    method: 'POST',
    path: `/${fakeID}/requests/xyz/accept`,
    status: 400,
    data: { set: { target: 'true' } },
  },
  {
    method: 'POST',
    path: `/${fakeID}/requests/xyz/reject`,
    status: 400,
    data: { set: { target: 'true' } },
  }
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
    expect(routesToSecureNoAuth.length).toBe(animesRoutes.length);
    for (const route of routesToSecureNoAuth) {
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
    expect(routesToSecureBadData.length).toBe(animesRoutes.length);
    for (const route of routesToSecureBadData) {
      const find = animesRoutes.find(
        (x) =>
          x
            .replace(':id', fakeID)
            .replace(':animeID', fakeID)
            .replace(':patchID', 'xyz') === route.path
      );
      if (!find) console.log(find, route.path);
      expect(find).toBeDefined();
    }
  });

  for (const { method, path, status, data } of routesToSecureNoAuth) {
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

  for (const { method, path, status, data } of routesToSecureBadData) {
    it(`${filter} @secure | avec des données incorrectes | ${path}`, async () => {
      server.testingUser = {
        id: `test`,
        username: `devlerito`,
        displayName: `DevLeriTo`,
        permissions: PermissionsArray.filter((x) => x.startsWith('ANIME')),
      };
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
  for (const { method, path, status, data } of routesToSecureNoAuth) {
    it(`${filter} @secure | avec des mauvaise permissions | ${path}`, async () => {
      server.testingUser = {
        id: `test`,
        username: `devlerito`,
        displayName: `DevLeriTo`,
        permissions: [`MANGA_CREATE_REQUEST`],
      };

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
      expect(response.statusCode).toBe(
        path.endsWith('/requests') ? 200 : status
      );
    });
  }
});

describe(`${filter} | Créer un anime de A-Z et vérifier sa disponibilité`, () => {
  let data: APIResponse<IAnime>;
  it(`${filter} | Créer un anime`, async () => {
    server.testingUser = {
      id: `test`,
      username: `devlerito`,
      displayName: `DevLeriTo`,
      permissions: ['ANIME_CREATE'],
    };

    const response = await server.app
      .inject()
      .post(`/v1/animes/create`)
      .headers({ 'Content-Type': `application/json` })
      .body(JSON.stringify(parseData))
      .end();

    expect(response.statusCode).toBe(200);

    data = await response.json();

    expect(data).toBeTruthy();
    expect(data.data?.isVerified).toBe(false);

    expect(data).toBeTruthy();
    expect(data.patch).toBeTruthy();

    if (!data.patch) return;

    const patch = await Patch.get(data.patch.id, {
      nullThrowErr: false,
      cache: false,
    });

    expect(patch).toBeTruthy();
    expect(patch?.author.id).toBe(server.testingUser.id);
    expect(patch?.type).toBe('CREATE');
    expect(patch?.status).toBe('ACCEPTED');
    expect(patch?.target.id).toBe(data.data?.id);
    expect(patch?.targetPath).toBe('Anime');
  });

  it(`${filter} | Vérifier que l'anime envoyé correspond a l'anime retourné`, async () => {
    await AnimeEqualTEST(data.data, parseData.data);
  });

  it(`${filter} | Récupérer l'anime crée`, async () => {
    expect(data).toBeTruthy();

    const response = await server.app
      .inject()
      .get(`/v1/animes/${data.data?.id}`)
      .end();

    expect(response.statusCode).toBe(200);

    const anime: APIResponse<IAnime> = await response.json();

    expect(anime).toBeTruthy();
    expect(anime.data?.isVerified).toBe(false);

    await AnimeEqualTEST(anime.data, parseData.data);
  });

  it(`${filter} | Vérifier l'anime`, async () => {
    server.testingUser = {
      id: `test`,
      username: `devlerito`,
      displayName: `DevLeriTo`,
      permissions: ['ANIME_VERIFY'],
    };

    const response = await server.app
      .inject()
      .post(`/v1/animes/${data.data?.id}/verify`)
      .headers({ 'Content-Type': `application/json` })
      .body(
        JSON.stringify(MediaVerifyBody.partial().parse({ description: 'test' }))
      )
      .end();

    expect(response.statusCode).toBe(200);

    const anime = await response.json();

    expect(anime).toBeTruthy();
    expect(anime.data?.isVerified).toBe(true);
  });

  it(`${filter} | Dévérifier l'anime`, async () => {
    server.testingUser = {
      id: `test`,
      username: `devlerito`,
      displayName: `DevLeriTo`,
      permissions: ['ANIME_VERIFY'],
    };

    const response = await server.app
      .inject()
      .post(`/v1/animes/${data.data?.id}/unverify`)
      .headers({ 'Content-Type': `application/json` })
      .body(
        JSON.stringify(MediaVerifyBody.partial().parse({ description: 'test' }))
      )
      .end();

    expect(response.statusCode).toBe(200);

    const anime = await response.json();

    expect(anime).toBeTruthy();
    expect(anime.data?.isVerified).toBe(false);
  });

  let dataReq: APIResponse<IAnime>;

  it(`${filter} | Créer une demande de création d'un anime`, async () => {
    server.testingUser = {
      id: `test`,
      username: `devlerito`,
      displayName: `DevLeriTo`,
      permissions: ['ANIME_CREATE_REQUEST'],
    };

    const response = await server.app
      .inject()
      .post(`/v1/animes/requests/create`)
      .headers({ 'Content-Type': `application/json` })
      .body(JSON.stringify(parseData))
      .end();

    expect(response.statusCode).toBe(200);

    dataReq = await response.json();

    expect(dataReq).toBeTruthy();
    expect(dataReq.data?.isVerified).toBe(false);

    expect(dataReq).toBeTruthy();
    expect(dataReq.patch).toBeTruthy();

    if (!dataReq.patch) return;

    const patch = await Patch.get(dataReq.patch.id, {
      nullThrowErr: false,
      cache: false,
    });

    expect(patch).toBeTruthy();
    expect(patch?.author.id).toBe(server.testingUser.id);
    expect(patch?.type).toBe('CREATE');
    expect(patch?.status).toBe('PENDING');
    expect(patch?.target.id).toBe(dataReq.data?.id);
    expect(patch?.targetPath).toBe('Anime');
  });

  it(`${filter} | Vérifier que la demande de l'anime envoyé correspond a l'anime retourné`, async () => {
    await AnimeEqualTEST(dataReq.data, parseData.data);
  });

  it(`${filter} | Créer une demande de modification d'un anime sans modifier l'anime`, async () => {
    server.testingUser = {
      id: `test`,
      username: `devlerito`,
      displayName: `DevLeriTo`,
      permissions: ['ANIME_PATCH_REQUEST'],
    };

    const response = await server.app
      .inject()
      .post(`/v1/animes/${data.data?.id}/requests/create`)
      .headers({ 'Content-Type': `application/json` })
      .body(JSON.stringify(AnimeDataToZOD(data.data!)))
      .end();

    expect(response.statusCode).toBe(204);
    try {
      await response.json();
    } catch (err) {
      if (err instanceof Error) {
        expect(err?.toString()).toContain('Unexpected end of JSON input');
      }
    }
  });

  let patchShared: IPatch;
  let animeUpdatedShared: APIResponse<IAnime>;

  it(`${filter} | Créer une demande de modification d'un anime`, async () => {
    server.testingUser = {
      id: `test`,
      username: `devlerito`,
      displayName: `DevLeriTo`,
      permissions: ['ANIME_PATCH_REQUEST'],
    };

    const response = await server.app
      .inject()
      .post(`/v1/animes/${data.data?.id}/requests/create`)
      .headers({ 'Content-Type': `application/json` })
      .body(JSON.stringify(parseData))
      .end();

    expect(response.statusCode).toBe(200);

    const anime: APIResponse<IAnime> = await response.json();

    expect(anime).toBeTruthy();
    await AnimeEqualTEST(anime.data, parseData.data);

    expect(anime).toBeTruthy();
    expect(anime.patch).toBeTruthy();

    if (!anime.patch) return;

    const patch = await Patch.get(anime.patch.id, {
      nullThrowErr: false,
      cache: false,
    });

    expect(patch).toBeTruthy();
    expect(patch?.author.id).toBe(server.testingUser.id);
    expect(patch?.type).toBe('UPDATE');
    expect(patch?.status).toBe('PENDING');
    expect(patch?.target.id).toBe(anime.data?.id);
    expect(patch?.targetPath).toBe('Anime');

    patchShared = anime.patch!;
    animeUpdatedShared = anime;
  });

  it(`${filter} | Modifier une demande de modification d'un anime sans faire de modification`, async () => {
    server.testingUser = {
      id: `test`,
      username: `devlerito`,
      displayName: `DevLeriTo`,
      permissions: ['ANIME_REQUEST_PATCH'],
    };

    const response = await server.app
      .inject()
      .post(`/v1/animes/${data.data?.id}/requests/${patchShared.id}/update`)
      .headers({ 'Content-Type': `application/json` })
      .body(JSON.stringify(AnimeDataToZOD(animeUpdatedShared.data!)))
      .end();

    expect(response.statusCode).toBe(204);
    try {
      await response.json();
    } catch (err) {
      if (err instanceof Error) {
        expect(err?.toString()).toContain('Unexpected end of JSON input');
      }
    }
  });

  it(`${filter} | Modifier une demande de modification d'un anime`, async () => {
    server.testingUser = {
      id: `test`,
      username: `devlerito`,
      displayName: `DevLeriTo`,
      permissions: ['ANIME_REQUEST_PATCH'],
    };

    const response = await server.app
      .inject()
      .post(`/v1/animes/${data.data?.id}/requests/${patchShared.id}/update`)
      .headers({ 'Content-Type': `application/json` })
      .body(JSON.stringify(parseData))
      .end();

    expect(response.statusCode).toBe(200);

    const anime: APIResponse<IAnime> = await response.json();
    await AnimeEqualTEST(anime.data, parseData.data);

    expect(anime).toBeTruthy();
    expect(anime.patch).toBeTruthy();

    if (!anime.patch) return;

    const originalPatch = await Patch.get(patchShared.id, {
      nullThrowErr: false,
      cache: false,
    });

    expect(originalPatch).toBeTruthy();
    expect(originalPatch?.author.id).toBe(server.testingUser.id);
    expect(originalPatch?.type).toBe(patchShared.type);
    expect(originalPatch?.status).toBe(patchShared.status);
    expect(originalPatch?.target.id).toBe(anime.data?.id);
    expect(originalPatch?.targetPath).toBe('Anime');

    console.log(anime.patch);

    const updatePatch = await Patch.get(anime.patch.id, {
      nullThrowErr: false,
      cache: false,
    });

    console.log(updatePatch);

    expect(updatePatch).toBeTruthy();
    expect(updatePatch?.author.id).toBe(server.testingUser.id);
    expect(updatePatch?.moderator?.id).toBe(server.testingUser.id);
    expect(updatePatch?.type).toBe('UPDATE');
    expect(updatePatch?.status).toBe('ACCEPTED');
    expect(updatePatch?.target.id).toBe(originalPatch?.id);
    expect(updatePatch?.targetPath).toBe('Patch');
  });

  it(`${filter} | Accepter une demande de modification d'un anime`, async () => {
    server.testingUser = {
      id: `test`,
      username: `devlerito`,
      displayName: `DevLeriTo`,
      permissions: ['ANIME_REQUEST_VERIFY'],
    };

    const response = await server.app
      .inject()
      .post(`/v1/animes/${data.data?.id}/requests/${patchShared.id}/accept`)
      .headers({ 'Content-Type': `application/json` })
      .body(JSON.stringify(MediaVerifyBody.partial().parse({ reason: 'test' })))
      .end();

    expect(response.statusCode).toBe(200);

    const anime: APIResponse<IAnime> = await response.json();
    await AnimeEqualTEST(anime.data, parseData.data);

    expect(anime).toBeTruthy();
    expect(anime.patch).toBeTruthy();

    if (!anime.patch) return;

    const originalPatch = await Patch.get(patchShared.id, {
      nullThrowErr: false,
      json: false,
      cache: false,
    });

    expect(originalPatch).toBeTruthy();
    expect(originalPatch?.author.id).toBe(server.testingUser.id);
    expect(originalPatch?.type).toBe(patchShared.type);
    expect(originalPatch?.status).toBe('ACCEPTED');
    expect(originalPatch?.target.id).toBe(anime.data?.id);
    expect(originalPatch?.targetPath).toBe('Anime');
    if (originalPatch?.changes) {
      // Vérifier que les changements ont bien été appliqués
      if (!anime.data?.id) return;
      const updatedAnime = await Anime.get(anime.data?.id, {
        nullThrowErr: true,
        json: false,
      });
      const changedAnime = Patch.getChangedFromDiff(
        updatedAnime.toJSON(),
        originalPatch.changes
      );
      const { changes } = await updatedAnime.getDBDiff(changedAnime);
      expect(changes).toBeUndefined();
    }
  });

  it(`${filter} | Refuser la demande de modification d'un anime`, async () => {
    server.testingUser = {
      id: `test`,
      username: `devlerito`,
      displayName: `DevLeriTo`,
      permissions: ['ANIME_REQUEST_VERIFY', 'ANIME_CREATE_REQUEST'],
    };

    const response1 = await server.app
      .inject()
      .post(`/v1/animes/requests/create`)
      .headers({ 'Content-Type': `application/json` })
      .body(JSON.stringify(parseData))
      .end();

    expect(response1.statusCode).toBe(200);

    const req: APIResponse<IAnime> = await response1.json();

    const response = await server.app
      .inject()
      .post(`/v1/animes/${req.data?.id}/requests/${req.patch?.id}/reject`)
      .headers({ 'Content-Type': `application/json` })
      .body(JSON.stringify(MediaVerifyBody.partial().parse({ reason: 'test' })))
      .end();

    expect(response.statusCode).toBe(200);

    const anime: APIResponse<IAnime> = await response.json();
    await AnimeEqualTEST(anime.data, parseData.data);

    expect(anime).toBeTruthy();
    expect(anime.patch).toBeTruthy();

    if (!anime.patch) return;
    expect(req.patch?.id).toBeTruthy();
    if (!req.patch?.id) return;

    const originalPatch = await Patch.get(req.patch?.id, {
      nullThrowErr: false,
      json: false,
      cache: false,
    });

    expect(originalPatch).toBeTruthy();
    expect(originalPatch?.author.id).toBe(server.testingUser.id);
    expect(originalPatch?.type).toBe('CREATE');
    expect(originalPatch?.status).toBe('REJECTED');
    expect(originalPatch?.target.id).toBe(req.data?.id);
    expect(originalPatch?.targetPath).toBe('Anime');

    if (originalPatch?.isCreate()) {
      if (!req.data?.id) return;
      // Vérifier que l'anime a bien été supprimé si il a été pré-crée;
      const findAnime = await Anime.get(req.data?.id, {
        nullThrowErr: false,
        cache: false,
      });
      expect(findAnime).toBeNull();
    }
    if (!originalPatch) return;
  });
});

/** END animes/create */
