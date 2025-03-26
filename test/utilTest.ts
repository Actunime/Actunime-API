import {
  IAnime,
  ICharacter,
  ICompany,
  IDate,
  IGroupe,
  IMediaLink,
  IMediaTitle,
  IPatchStatus,
  IPerson,
  ITrack,
} from '@actunime/types';
import {
  IAnimeCreateBody,
  ICharacterBody,
  ICompanyBody,
  IMediaLinkBody,
  IGroupeBody,
  IPersonBody,
  ITrackBody,
} from '@actunime/validations';
import { it } from 'node:test';
import { ClientSession } from 'mongoose';
import assert from 'assert';
import { Person } from '../src/_lib/media/_person';

const LinkTEST = (label: string, inputs?: IMediaLinkBody[]) => {
  return async (original: IMediaLink, i: number) => {
    const input = inputs?.[i];
    assert('qdzqzd', 'qdzqzddqz');
    assert.deepEqual(
      original.name,
      input?.name,
      `Le nom du lien de la ${label} doit correspondre`
    );
    assert.deepEqual(
      original.value,
      input?.value,
      `L'url du lien de la ${label} doit correspondre`
    );
  };
};

const NameTEST = async (
  label: string,
  original?: IMediaTitle,
  input?: IMediaTitle
) => {
  expect(original?.default).toStrictEqual(input?.default);
  expect(original?.alias?.length).toStrictEqual(input?.alias?.length);
  expect(original?.alias?.join(',')).toStrictEqual(input?.alias?.join(','));
};

const DateTEST = async (label: string, original?: IDate, input?: IDate) => {
  expect(original?.year).toStrictEqual(input?.year);
  expect(original?.month).toStrictEqual(input?.month);
  expect(original?.day).toStrictEqual(input?.day);
  expect(original?.hours).toStrictEqual(input?.hours);
  expect(original?.minutes).toStrictEqual(input?.minutes);
  expect(original?.seconds).toStrictEqual(input?.seconds);
};

export const GroupeEqualTEST = async (
  original: IGroupe,
  {
    input,
    id,
  }: {
    id?: string;
    input?: IGroupeBody;
  }
) => {
  if (input) {
    await NameTEST('Groupe', original.name, input?.name);
  } else if (id) {
    expect(original?.id).toBe(id);
  }
};

export const CompanyEqualTEST = async (
  original: ICompany,
  {
    input,
    id,
  }: {
    id?: string;
    input?: ICompanyBody;
  }
) => {
  if (input) {
    await it(`Société nouvelle, les données correspondent ?`, async () => {
      await NameTEST('societe', original.name, input.name);
      await DateTEST('societe', original.createdDate, input.createdDate);
      assert.deepEqual(
        original?.description,
        input?.description,
        'Le bio de la societe doit correspondre'
      );
      assert.deepEqual(
        original?.type,
        input?.type,
        'Le type de la societe doit correspondre'
      );
      assert.deepEqual(
        original?.links?.length,
        input?.links?.length,
        'Le nombre de lien de la societe doit correspondre'
      );
      if (original.links)
        await Promise.all(
          original.links?.map(LinkTEST('societe', input?.links))
        );
    });
  } else if (id) {
    assert.deepEqual(original?.id, id, "L'id de la societe doit correspondre");
  }
};

export const PersonEqualTEST = async (
  label: string,
  original: IPerson,
  {
    input,
    id,
  }: {
    id?: string;
    input?: IPersonBody;
  }
) => {
  if (input) {
    await it(`Personne nouvelle, les données correspondent ?`, async () => {
      await NameTEST(label, original.name, input.name);
      await DateTEST(label, original.birthDate, input.birthDate);
      await DateTEST(label, original.deathDate, input.deathDate);
      assert.deepEqual(
        original?.description,
        input?.description,
        `Le bio du ${label} doit correspondre`
      );
      assert.deepEqual(
        original?.links?.length,
        input?.links?.length,
        `Le nombre de lien du ${label} doit correspondre`
      );
      if (original.links)
        await Promise.all(original.links?.map(LinkTEST(label, input?.links)));
    });
  } else if (id) {
    assert.deepEqual(original?.id, id, `L'id du ${label} doit correspondre`);
  }
};

export const CharacterEqualTEST = async (
  label: string,
  original: ICharacter,
  {
    input,
    id,
    session,
  }: {
    id?: string;
    input?: ICharacterBody;
    session?: ClientSession;
  }
) => {
  if (input) {
    await it(`Character nouveau, les données correspondent ?`, async () => {
      await NameTEST(label, original.name, input.name);
      await DateTEST(label, original.birthDate, input.birthDate);
      assert.deepEqual(
        original?.description,
        input?.description,
        `Le bio du ${label} doit correspondre`
      );
      assert.deepEqual(
        original?.actors?.length,
        input?.actors?.length,
        `Le nombre d'${label} doit correspondre`
      );
      if (original.actors)
        await Promise.all(
          original.actors?.map(async ({ id }, index) => {
            const actor = await Person.get(id, { nullThrowErr: true, session });
            const old = input.actors?.[index];
            await PersonEqualTEST('Acteur', actor, {
              id,
              input: old?.newPerson,
            });
          })
        );
    });
  } else if (id) {
    assert.deepEqual(original?.id, id, `L'id du ${label} doit correspondre`);
  }
};

export const TrackEqualTEST = async (
  label: string,
  original: ITrack,
  {
    input,
    id,
    session,
  }: {
    id?: string;
    input?: ITrackBody;
    session?: ClientSession;
  }
) => {
  if (input) {
    await it(`Track nouveau, les données correspondent ?`, async () => {
      await NameTEST(label, original.name, input.name);
      await DateTEST(label, original.releaseDate, input.releaseDate);
      assert.deepEqual(
        original?.description,
        input?.description,
        `La description du ${label} doit correspondre`
      );
      assert.deepEqual(
        original?.artists?.length,
        input?.artists?.length,
        `Le nombre d'${label} doit correspondre`
      );
      if (original.artists)
        await Promise.all(
          original.artists?.map(async ({ id }, index) => {
            const artist = await Person.get(id, {
              nullThrowErr: true,
              session,
            });
            const old = input.artists?.[index];
            await PersonEqualTEST('Artist', artist, {
              id,
              input: old?.newPerson,
            });
          })
        );
      assert.deepEqual(
        original.links?.length,
        input.links?.length,
        `Le nombre de lien de ${label} doit correspondre`
      );
      if (original?.links)
        await Promise.all(original?.links?.map(LinkTEST(label, input?.links)));
    });
  } else if (id) {
    assert.deepEqual(original?.id, id, `L'id du ${label} doit correspondre`);
  }
};

export const AnimeEqualTEST = async (
  original?: IAnime | null,
  input?: IAnimeCreateBody['data'],
  options?: {
    session: ClientSession;
    patchStatus: IPatchStatus;
    animeID?: string;
  }
) => {
  const { animeID } = options || {};

    expect(original).toBeDefined();
    expect(input).toBeDefined();
    if (!original) return;
    if (!input) return;
    if (animeID) expect(original.id).toStrictEqual(animeID);
    expect(original?.manga?.id).toStrictEqual(input?.manga?.id);
    expect(original?.parent?.id).toStrictEqual(input?.parent?.id);
    await NameTEST('anime', original?.title, input?.title);
    await DateTEST('anime', original?.date?.start, input?.date?.start);
    await DateTEST('anime', original?.date?.end, input?.date?.end);
    expect(original.synopsis).toBe(input.synopsis);
    expect(original.source).toBe(input.source);
    expect(original.format).toBe(input.format);
    expect(original.vf).toBe(input.vf);
    expect(original.trailer).toBe(input.trailer);
    expect(original.genres?.length).toBe(input.genres?.length);
    expect(original.genres?.join(',')).toStrictEqual(input?.genres?.join(','));
    expect(original.status).toBe(input.status);
    expect(original.episodes?.airing).toBe(input.episodes?.airing);
    expect(original.episodes?.total).toBe(input.episodes?.total);
    expect(original.episodes?.durationMinutes).toBe(
      input.episodes?.durationMinutes
    );
    await DateTEST(
      'episode',
      original?.episodes?.nextAiringDate,
      input?.episodes?.nextAiringDate
    );
    expect(original.adult).toBe(input.adult);
    expect(original.explicit).toBe(input.explicit);
    expect(original.links?.length).toBe(input.links?.length);
    if (original?.links)
      await Promise.all(original?.links?.map(LinkTEST('anime', input?.links)));

    // await it('Vérifier que les sous-medias soient corrects', async () => {
    //   if (!original?.groupe?.id)
    //     return t.assert.fail(
    //       `Le groupe de l'anime (${original?.title?.default}) doit avoir un id`
    //     );
    //   const groupe = await Groupe.get(original?.groupe?.id, {
    //     nullThrowErr: true,
    //     session,
    //   });

    //   await GroupeEqualTEST(groupe, {
    //     id: original?.groupe?.id,
    //     input: input?.groupe?.newGroupe,
    //   });

    //   await it('Société(s)', async () => {
    //     assert.deepEqual(
    //       original.companys?.length,
    //       input?.companys?.length === 0 ? undefined : input?.companys?.length,
    //       'Le nombre de societe doit correspondre'
    //     );
    //     if (original.companys)
    //       await Promise.all(
    //         original.companys?.map(async ({ id }, index) => {
    //           const company = await Company.get(id, {
    //             nullThrowErr: true,
    //             session,
    //           });
    //           const oldCompany = input?.companys?.[index];
    //           await CompanyEqualTEST(company, {
    //             id,
    //             input: oldCompany?.newCompany,
    //           });
    //         })
    //       );
    //   });

    //   await it('Staff(s)', async () => {
    //     assert.deepEqual(
    //       original.staffs?.length,
    //       input?.staffs?.length === 0 ? undefined : input?.staffs?.length,
    //       'Le nombre de staff doit correspondre'
    //     );
    //     if (original.staffs)
    //       await Promise.all(
    //         original.staffs?.map(async ({ id }, index) => {
    //           const staff = await Person.get(id, {
    //             nullThrowErr: true,
    //             session,
    //           });
    //           const oldStaff = input?.staffs?.[index];
    //           await PersonEqualTEST('Staff', staff, {
    //             id,
    //             input: oldStaff?.newPerson,
    //           });
    //         })
    //       );
    //   });

    //   await it('Character(s)', async () => {
    //     assert.deepEqual(
    //       original.characters?.length,
    //       input?.characters?.length === 0
    //         ? undefined
    //         : input?.characters?.length,
    //       'Le nombre de personnage doit correspondre'
    //     );
    //     if (original.characters)
    //       await Promise.all(
    //         original.characters?.map(async ({ id }, index) => {
    //           const character = await Character.get(id, {
    //             nullThrowErr: true,
    //             session,
    //           });
    //           const old = input?.characters?.[index];
    //           await CharacterEqualTEST('Character', character, {
    //             id,
    //             input: old?.newCharacter,
    //             session,
    //           });
    //         })
    //       );
    //   });

    //   await it('Track(s)', async () => {
    //     assert.deepEqual(
    //       original.tracks?.length,
    //       input?.tracks?.length === 0 ? undefined : input?.tracks?.length,
    //       'Le nombre de musiques doit correspondre'
    //     );
    //     if (original.tracks)
    //       await Promise.all(
    //         original.tracks?.map(async ({ id }, index) => {
    //           const track = await Track.get(id, {
    //             nullThrowErr: true,
    //             session,
    //           });
    //           const old = input?.tracks?.[index];
    //           await TrackEqualTEST('Track', track, {
    //             id,
    //             input: old?.newTrack,
    //             session,
    //           });
    //         })
    //       );
    //   });
    // });

    // await it("Vérification que le patch de l'anime a bien été crée", async (t) => {
    //   if (!original) return t.assert.fail('Original est undefined');
    //   const patch = await new PatchController(session).getPatchFrom(
    //     'Anime',
    //     original.id,
    //     patchStatus
    //   );
    //   if (!patch) {
    //     t.assert.fail("Aucun patch crée pour l'anime");
    //   } else if (patch) {
    //     assert.deepEqual(
    //       patch.targetPath,
    //       'Anime',
    //       "Le patch n'a pas le bon targetPath"
    //     );
    //     assert.deepEqual(
    //       patch.target.id,
    //       original?.id,
    //       "Le patch n'a pas le bon target"
    //     );
    //     assert.deepEqual(
    //       patch.status,
    //       patchStatus,
    //       "Le patch n'a pas le bon status"
    //     );
    //   }
    // });
};
