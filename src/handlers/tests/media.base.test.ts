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
  ICreate_Link_ZOD,
  IGroupeBody,
  IPersonBody,
  ITrackBody,
} from '@actunime/validations';
import { it } from 'node:test';
import { PatchController } from '../../controllers/patch.controllers';
import { PersonController } from '../../controllers/person.controler';
import { GroupeController } from '../../controllers/groupe.controller';
import { ClientSession } from 'mongoose';
import { CompanyController } from '../../controllers/company.controller';
import { CharacterController } from '../../controllers/character.controller';
import { TrackController } from '../../controllers/track.controller';
import assert from 'assert';

const LinkTest = (label: string, inputs?: ICreate_Link_ZOD[]) => {
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

const NameTest = async (
  label: string,
  original?: IMediaTitle,
  input?: IMediaTitle
) => {
  assert.deepEqual(
    original?.default,
    input?.default,
    `Le nom ${label} doit correspondre`
  );
  assert.deepEqual(
    original?.alias?.length,
    input?.alias?.length,
    `Le nombre d'alias de ${label} doit correspondre`
  );
  assert.deepEqual(
    original?.alias?.join(', '),
    input?.alias?.join(', '),
    `Le nom alias ${label} doit correspondre`
  );
};

const DateTest = async (label: string, original?: IDate, input?: IDate) => {
  assert.deepEqual(
    original?.year,
    input?.year,
    `L'annee de ${label} doit correspondre`
  );
  assert.deepEqual(
    original?.month,
    input?.month,
    `Le mois de ${label} doit correspondre`
  );
  assert.deepEqual(
    original?.day,
    input?.day,
    `Le jour de ${label} doit correspondre`
  );
  assert.deepEqual(
    original?.hours,
    input?.hours,
    `L'heure de ${label} doit correspondre`
  );
  assert.deepEqual(
    original?.minutes,
    input?.minutes,
    `Les minutes de ${label} doit correspondre`
  );
  assert.deepEqual(
    original?.seconds,
    input?.seconds,
    `Les secondes de ${label} doit correspondre`
  );
};

const GroupeEqualTest = async (
  original: IGroupe,
  {
    input,
    id,
    patchStatus,
    patchController,
  }: {
    id?: string;
    input?: IGroupeBody;
    patchStatus?: IPatchStatus;
    patchController: PatchController;
  }
) => {
  if (input) {
    await NameTest('Groupe', original.name, input?.name);
    await it(`Groupe nouveau, le patch a été crée`, async (t) => {
      const patch = await patchController.getPatchFrom('Groupe', original.id);
      if (!patch) {
        t.assert.fail(
          `Aucun patch crée pour le groupe (${
            original.id || original.name || input?.name
          })`
        );
      } else if (patch) {
        assert.deepEqual(
          patch.status,
          patchStatus,
          `Le patch de groupe n'a pas le bon status`
        );
      }
    });
  } else if (id) {
    assert.deepEqual(original?.id, id, "L'id du groupe doit correspondre");
  }
};

const CompanyEqualTest = async (
  original: ICompany,
  {
    input,
    id,
    patchStatus,
    patchController,
  }: {
    id?: string;
    input?: ICompanyBody;
    patchStatus?: IPatchStatus;
    patchController: PatchController;
  }
) => {
  if (input) {
    await it(`Société nouvelle, les données correspondent ?`, async () => {
      await NameTest('societe', original.name, input.name);
      await DateTest('societe', original.createdDate, input.createdDate);
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
          original.links?.map(LinkTest('societe', input?.links))
        );
    });
    await it(`Société nouvelle, le patch a été crée`, async (t) => {
      const patch = await patchController.getPatchFrom('Company', original.id);
      if (!patch) {
        t.assert.fail(
          `Aucun patch crée pour la societé (${
            original.id || original.name || input?.name
          })`
        );
      } else if (patch) {
        assert.deepEqual(
          patch.status,
          patchStatus,
          `Le patch de société n'a pas le bon status`
        );
      }
    });
  } else if (id) {
    assert.deepEqual(original?.id, id, "L'id de la societe doit correspondre");
  }
};

const PersonEqualTest = async (
  label: string,
  original: IPerson,
  {
    input,
    id,
    patchStatus,
    patchController,
  }: {
    id?: string;
    input?: IPersonBody;
    patchStatus?: IPatchStatus;
    patchController: PatchController;
  }
) => {
  if (input) {
    await it(`Personne nouvelle, les données correspondent ?`, async (t) => {
      await NameTest(label, original.name, input.name);
      await DateTest(label, original.birthDate, input.birthDate);
      await DateTest(label, original.deathDate, input.deathDate);
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
        await Promise.all(original.links?.map(LinkTest(label, input?.links)));
    });
    await it(`Personne nouvelle, le patch a été crée`, async (t) => {
      const patch = await patchController.getPatchFrom('Person', original.id);
      if (!patch) {
        t.assert.fail(
          `Aucun patch crée pour la ${label} (${
            original.id || original.name || input?.name
          })`
        );
      } else if (patch) {
        assert.deepEqual(
          patch.status,
          patchStatus,
          `Le patch de ${label} n'a pas le bon status`
        );
      }
    });
  } else if (id) {
    assert.deepEqual(original?.id, id, `L'id du ${label} doit correspondre`);
  }
};

const CharacterEqualTest = async (
  label: string,
  original: ICharacter,
  {
    input,
    id,
    patchStatus,
    patchController,
    personController,
  }: {
    id?: string;
    input?: ICharacterBody;
    patchStatus?: IPatchStatus;
    patchController: PatchController;
    personController: PersonController;
  }
) => {
  if (input) {
    await it(`Character nouveau, les données correspondent ?`, async (t) => {
      await NameTest(label, original.name, input.name);
      await DateTest(label, original.birthDate, input.birthDate);
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
            const actor = await personController.getById(id);
            const old = input.actors?.[index];
            await PersonEqualTest('Acteur', actor, {
              id,
              input: old?.newPerson,
              patchStatus,
              patchController,
            });
          })
        );
    });
    await it(`Character nouveau, le patch a été crée`, async (t) => {
      const patch = await patchController.getPatchFrom(
        'Character',
        original.id
      );
      if (!patch) {
        t.assert.fail(
          `Aucun patch crée pour la ${label} (${
            original.id || original.name || input?.name
          })`
        );
      } else if (patch) {
        assert.deepEqual(
          patch.status,
          patchStatus,
          `Le patch de ${label} n'a pas le bon status`
        );
      }
    });
  } else if (id) {
    assert.deepEqual(original?.id, id, `L'id du ${label} doit correspondre`);
  }
};

const TrackEqualTest = async (
  label: string,
  original: ITrack,
  {
    input,
    id,
    patchStatus,
    patchController,
    personController,
  }: {
    id?: string;
    input?: ITrackBody;
    patchStatus?: IPatchStatus;
    patchController: PatchController;
    personController: PersonController;
  }
) => {
  if (input) {
    await it(`Track nouveau, les données correspondent ?`, async (t) => {
      await NameTest(label, original.name, input.name);
      await DateTest(label, original.releaseDate, input.releaseDate);
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
            const artist = await personController.getById(id);
            const old = input.artists?.[index];
            await PersonEqualTest('Artist', artist, {
              id,
              input: old?.newPerson,
              patchStatus,
              patchController,
            });
          })
        );
      assert.deepEqual(
        original.links?.length,
        input.links?.length,
        `Le nombre de lien de ${label} doit correspondre`
      );
      if (original?.links)
        await Promise.all(original?.links?.map(LinkTest(label, input?.links)));
    });
    await it(`Track nouveau, le patch a été crée`, async (t) => {
      const patch = await patchController.getPatchFrom('Track', original.id);
      if (!patch) {
        t.assert.fail(
          `Aucun patch crée pour la ${label} (${
            original.id || original.name || input?.name
          })`
        );
      } else if (patch) {
        assert.deepEqual(
          patch.status,
          patchStatus,
          `Le patch de ${label} n'a pas le bon status`
        );
      }
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
  const { session, patchStatus, animeID } = options || {};
  const personController = new PersonController(session);
  const patchController = new PatchController(session);

  await it("L'anime retourné correspond a l'anime envoyé", async (t) => {
    if (animeID) {
      assert.deepEqual(original?.id, animeID, "L'id doit correspondre");
    }

    assert.deepEqual(
      original?.manga?.id,
      input?.manga?.id,
      'Le manga doit correspondre'
    );

    assert.deepEqual(
      original?.parent?.id,
      input?.parent?.id,
      'Le parent doit correspondre'
    );

    await NameTest('anime', original?.title, input?.title);
    await DateTest('anime', original?.date?.start, input?.date?.start);
    await DateTest('anime', original?.date?.end, input?.date?.end);

    assert.deepEqual(
      original?.synopsis,
      input?.synopsis,
      'Le synopsis doit correspondre'
    );

    assert.deepEqual(
      original?.source,
      input?.source,
      'Le source doit correspondre'
    );

    assert.deepEqual(
      original?.format,
      input?.format,
      'Le format doit correspondre'
    );

    assert.deepEqual(
      original?.status,
      input?.status,
      'Le status doit correspondre'
    );

    assert.deepEqual(original?.vf, input?.vf, 'Le vf doit correspondre');

    assert.deepEqual(
      original?.trailer,
      input?.trailer,
      'Le trailer doit correspondre'
    );

    assert.deepEqual(
      original?.genres?.length,
      input?.genres?.length,
      'Le nombre de genres doit correspondre'
    );
    assert.deepEqual(
      original?.genres?.join(', '),
      input?.genres?.join(', '),
      'Les genres doit correspondre'
    );

    assert.deepEqual(
      original?.status,
      input?.status,
      'Le status doit correspondre'
    );

    assert.deepEqual(
      original?.episodes?.airing,
      input?.episodes?.airing,
      "L'episode en cours doit correspondre"
    );
    assert.deepEqual(
      original?.episodes?.total,
      input?.episodes?.total,
      "Le total d'episode doit correspondre"
    );
    assert.deepEqual(
      original?.episodes?.durationMinutes?.toString(),
      input?.episodes?.durationMinutes,
      "La duree de l'episode doit correspondre"
    );
    await DateTest(
      'episode',
      original?.episodes?.nextAiringDate,
      input?.episodes?.nextAiringDate
    );

    assert.deepEqual(
      original?.adult,
      input?.adult,
      "L'adult doit correspondre"
    );

    assert.deepEqual(
      original?.explicit,
      input?.explicit,
      "L'explicit doit correspondre"
    );

    assert.deepEqual(
      original?.links?.length,
      input?.links?.length,
      'Le nombre de lien doit correspondre'
    );
    if (original?.links)
      await Promise.all(original?.links?.map(LinkTest('anime', input?.links)));

    await it('Vérifier que les sous-medias soient corrects', async () => {
      if (!original?.groupe?.id)
        return t.assert.fail(
          `Le groupe de l'anime (${original?.title?.default}) doit avoir un id`
        );
      const groupe = await new GroupeController(session).getById(
        original?.groupe?.id
      );

      await GroupeEqualTest(groupe, {
        id: original?.groupe?.id,
        input: input?.groupe?.newGroupe,
        patchStatus,
        patchController,
      });

      await it('Société(s)', async (t) => {
        assert.deepEqual(
          original.companys?.length,
          input?.companys?.length,
          'Le nombre de societe doit correspondre'
        );
        if (original.companys)
          await Promise.all(
            original.companys?.map(async ({ id }, index) => {
              const company = await new CompanyController(session).getById(id);
              const oldCompany = input?.companys?.[index];
              await CompanyEqualTest(company, {
                id,
                input: oldCompany?.newCompany,
                patchStatus,
                patchController,
              });
            })
          );
      });

      await it('Staff(s)', async (t) => {
        assert.deepEqual(
          original.staffs?.length,
          input?.staffs?.length,
          'Le nombre de staff doit correspondre'
        );
        if (original.staffs)
          await Promise.all(
            original.staffs?.map(async ({ id }, index) => {
              const staff = await personController.getById(id);
              const oldStaff = input?.staffs?.[index];
              await PersonEqualTest('Staff', staff, {
                id,
                input: oldStaff?.newPerson,
                patchStatus,
                patchController,
              });
            })
          );
      });

      await it('Character(s)', async (t) => {
        assert.deepEqual(
          original.characters?.length,
          input?.characters?.length,
          'Le nombre de personnage doit correspondre'
        );
        if (original.characters)
          await Promise.all(
            original.characters?.map(async ({ id }, index) => {
              const character = await new CharacterController(session).getById(
                id
              );
              const old = input?.characters?.[index];
              await CharacterEqualTest('Character', character, {
                id,
                input: old?.newCharacter,
                patchStatus,
                patchController,
                personController,
              });
            })
          );
      });

      await it('Track(s)', async (t) => {
        assert.deepEqual(
          original.tracks?.length,
          input?.tracks?.length,
          'Le nombre de musiques doit correspondre'
        );
        if (original.tracks)
          await Promise.all(
            original.tracks?.map(async ({ id }, index) => {
              const track = await new TrackController(session).getById(id);
              const old = input?.tracks?.[index];
              await TrackEqualTest('Track', track, {
                id,
                input: old?.newTrack,
                patchStatus,
                patchController,
                personController,
              });
            })
          );
      });
    });

    await it("Vérification que le patch de l'anime a bien été crée", async (t) => {
      const patch = await new PatchController(session).getPatchFrom(
        'Anime',
        original?.id!,
        patchStatus
      );
      if (!patch) {
        t.assert.fail("Aucun patch crée pour l'anime");
      } else if (patch) {
        assert.deepEqual(
          patch.targetPath,
          'Anime',
          "Le patch n'a pas le bon targetPath"
        );
        assert.deepEqual(
          patch.target.id,
          original?.id,
          "Le patch n'a pas le bon target"
        );
        assert.deepEqual(
          patch.status,
          patchStatus,
          "Le patch n'a pas le bon status"
        );
      }
    });
  });
};
