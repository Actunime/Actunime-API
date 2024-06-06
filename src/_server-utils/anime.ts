import { AnimeModel } from '../_models/_animeModel';
import { IAnime } from '../_types/animeType';
import { IUser } from '../_types/userType';
import { ObjCheckChanged, ObjKeyToDotKey } from '../_utils/objectChecker';
import { AnimeDataToZOD, IAdd_Anime_ZOD, ICreate_Anime_ZOD } from '../_validation/animeZOD';
import { CreateActivity } from './activity';
import { CharacterAddToRelation } from './character';
import { CompanyAddToRelation } from './company';
import { ErrorHandled } from './errorHandling';
import { GroupeAddToRelation } from './groupe';
import { MangaAddToRelation } from './manga';
import { BulkCreateMedias, IMediaDocTypeToSave } from './media';
import { PersonAddToRelation } from './person';
import { TrackAddToRelation } from './track';
import { CreateUpdate } from './update';

// type IAnimeDoc = Document<any, object, IAnime> & IAnime & Required<{ _id: Schema.Types.ObjectId; }>

const findAnimeById = async (id: string) => {
  const find = await AnimeModel.findOne({ id });
  if (!find) throw new ErrorHandled("L'anime est introuvable");
  return find;
};

export const AnimeAddToRelation = async (
  add: IAdd_Anime_ZOD | undefined,
  key: string,
  cb: (rel: { [key: string]: { id: string } }) => void
) => {
  if (!add || !Object.keys(add).length) return; // Pas obligatoire;
  if (add?.id) {
    const { id } = await findAnimeById(add.id);
    cb({ [key]: { id } });
    return { [key]: { id } };
  } else {
    throw new ErrorHandled(`Anime (${key}) invalide`);
  }
};

export async function CheckAnimeUnique(name: string, notId?: string) {
  const regex = new RegExp('^' + name + '$', 'i');

  const findAnimeByName = await AnimeModel.findOne({
    $or: [{ 'title.default': regex }]
  });

  if (notId && findAnimeByName?.id === notId) return;

  if (findAnimeByName) throw new ErrorHandled('Un anime est déjà enregistrer avec ce nom.');
}

export async function AnimeSaveDB(props: Partial<ICreate_Anime_ZOD>, user: IUser) {
  // Initialisation des medias à sauvegarder
  let mediasToSave: IMediaDocTypeToSave[] = [];

  const { groupe, parent, source, companys, staffs, characters, tracks, ...addAnime } = props;
  const newAnime = { ...addAnime } as any as IAnime;

  console.log('Anime création/modification en cours...');

  //? Gestion des Groupes
  await GroupeAddToRelation(groupe, ({ doc, groupe }) => {
    if (doc) {
      mediasToSave.push({ doc, path: 'Groupe' });
      console.log('Groupe (nouveau): ', doc.id, doc.name);
    }
    console.log('Groupe (assigné): ', groupe.id);
    Object.assign(newAnime, { groupe });
  });

  //? Gestion Parent
  await AnimeAddToRelation(parent as any, 'parent', ({ parent }) => {
    console.log('Parent (anime) (assigné): ', parent.id);
    Object.assign(newAnime, { parent });
  });

  //? Gestion Source
  await MangaAddToRelation(source as any, 'source', ({ source }) => {
    console.log('Source (manga) (assigné): ', source.id);
    Object.assign(newAnime, { source });
  });

  // //? Gestion Companys
  await CompanyAddToRelation(companys as any, ({ docs, companys }) => {
    if (docs)
      mediasToSave = mediasToSave.concat(
        docs.map((doc) => {
          console.log('Company (nouveau): ', doc.id, doc.name);
          return { doc, path: 'Company' };
        })
      );
    console.log('Company(s) (assigné): ', companys.map((company) => company.id).join(', '));
    Object.assign(newAnime, { companys });
  });

  //? Gestion Staffs
  await PersonAddToRelation(staffs as any, 'staffs', ({ docs, staffs }) => {
    if (docs)
      mediasToSave = mediasToSave.concat(
        docs.map((doc) => {
          console.log('Person (staff) (nouveau): ', doc.id, doc.name);
          return { doc, path: 'Person' };
        })
      );
    console.log('Person(s) (staff) (assigné): ', staffs.map((staff) => staff.id).join(', '));
    Object.assign(newAnime, { staffs });
  });

  // //? Gestion Characters
  await CharacterAddToRelation(characters as any, ({ docs, characters }) => {
    mediasToSave = mediasToSave.concat(
      docs.map((toSave) => {
        console.log(
          `${toSave.path === 'Character' ? 'Character' : 'Character Person (Actor)'} (nouveau): `,
          toSave.doc.id,
          toSave.doc.name
        );
        return toSave;
      })
    );
    console.log('Character(s) (assigné): ', characters.map((character) => character.id).join(', '));
    Object.assign(newAnime, { characters });
  });

  //? Gestion Tracks
  await TrackAddToRelation(tracks as any, ({ docs, tracks }) => {
    mediasToSave = mediasToSave.concat(
      docs.map((toSave) => {
        console.log(
          `${toSave.path === 'Track' ? 'Track' : 'Track Person (Artist)'} (nouveau): `,
          toSave.doc.id,
          toSave.doc.name
        );
        return toSave;
      })
    );
    console.log('Track(s) (assigné): ', tracks.map((track) => track.id).join(', '));
    Object.assign(newAnime, { tracks });
  });

  return {
    createRequest: async () => {
      const doc = new AnimeModel(newAnime);
      let update: any,
        activity,
        wasCreated = false;

      try {
        doc.isVerified = false;

        await doc.validate();

        await doc.save();
        wasCreated = true;

        update = await CreateUpdate({
          type: 'CREATE',
          actions: [{ label: 'REQUEST', user: { id: user.id } }],
          changes: newAnime,
          author: { id: user.id },
          targetPath: 'Anime',
          status: 'PENDING'
        });

        await BulkCreateMedias({
          medias: mediasToSave,
          authorId: user.id,
          actions: [{ label: 'REQUEST', user: { id: user.id } }],
          status: 'PENDING',
          activityType: 'MEMBER',
          updateRef: update.id
        });

        activity = await CreateActivity('MEMBER', 'REQUEST_ANIME', {
          author: { id: user.id },
          target: { id: update.id },
          targetPath: 'Update'
        }).catch(async (err) => {
          update.deleteOne().catch(() => {});
          throw err;
        });
      } catch (err) {
        if (wasCreated) await doc.deleteOne().catch(() => {});
        if (update) await update.deleteOne().catch(() => {});
        if (activity) await activity.deleteOne().catch(() => {});
        console.error(err);
        throw new ErrorHandled("Une erreur s'est produite lors de la sauvegarde de la demande");
      }
    },
    create: async (options?: {
      withUpdate?: boolean;
      withActivity?: boolean;
      updateRef?: string;
    }) => {
      const doc = new AnimeModel(newAnime);
      let update: any,
        activity,
        wasCreated = false;

      try {
        doc.isVerified = true;

        await doc.validate();

        await doc.save();
        wasCreated = true;

        if (options?.withUpdate === undefined || options?.withUpdate)
          update = await CreateUpdate({
            type: 'CREATE',
            actions: [
              {
                label: 'DIRECT_ACCEPT',
                user: { id: user.id }
              }
            ],
            author: { id: user.id },
            target: { id: doc.id },
            targetPath: 'Anime',
            status: 'ACCEPTED',
            ref: (options?.updateRef && { id: options?.updateRef }) || undefined
          });

        await BulkCreateMedias({
          medias: mediasToSave,
          authorId: user.id,
          actions: [
            {
              label: 'DIRECT_ACCEPT',
              user: { id: user.id }
            }
          ],
          status: 'ACCEPTED',
          activityType: 'MODERATION',
          withActivity: true,
          withUpdate: true,
          updateRef: update?.id || options?.updateRef
        });

        if (options?.withActivity === undefined || options?.withActivity)
          activity = await CreateActivity('MODERATION', 'CREATE_ANIME', {
            author: { id: user.id },
            target: { id: doc.id },
            targetPath: 'Anime'
          }).catch(async (err) => {
            update.deleteOne().catch(() => {});
            throw err;
          });
      } catch (err) {
        if (wasCreated) await doc.deleteOne().catch(() => {});
        if (update) await update.deleteOne().catch(() => {});
        if (activity) await activity.deleteOne().catch(() => {});
        console.error(err);
        throw new ErrorHandled("Une erreur s'est produite lors de la sauvegarde de l'anime");
      }
    },
    update: async (
      id: string,
      options?: {
        withUpdate?: boolean;
        withActivity?: boolean;
        updateRef?: string;
        authorId?: string;
      }
    ) => {
      const findAnime = await AnimeModel.findOne({ id });
      if (!findAnime) throw new ErrorHandled("L'anime est introuvable");

      const parseTOZOD = AnimeDataToZOD(findAnime.toJSON());
      const newAnimeTOZOD = AnimeDataToZOD(newAnime);
      const { changes, befores } = ObjCheckChanged(parseTOZOD, newAnimeTOZOD, ['id', '_id']);

      if (!changes) throw new ErrorHandled("Aucune modification n'a été effectuee");

      const objLevel1 = ObjKeyToDotKey(changes) as any;
      if (objLevel1?.['title.default']) {
        await CheckAnimeUnique(objLevel1['title.default'], findAnime.id);
      }
      let update: any,
        activity,
        wasUpdated = false;
      try {
        await findAnime.updateOne({ $set: objLevel1 }, { runValidators: true });
        wasUpdated = true;

        if (options?.withUpdate === undefined || options?.withUpdate)
          update = await CreateUpdate({
            type: 'UPDATE',
            actions: [
              {
                label: 'DIRECT_ACCEPT',
                user: { id: user.id }
              }
            ],
            author: { id: options?.authorId || user.id },
            changes,
            beforeChanges: befores,
            target: { id: findAnime.id },
            targetPath: 'Anime',
            status: 'ACCEPTED',
            ref: (options?.updateRef && { id: options?.updateRef }) || undefined
          });

        await BulkCreateMedias({
          medias: mediasToSave,
          authorId: options?.authorId || user.id,
          actions: [
            {
              label: 'DIRECT_ACCEPT',
              user: { id: user.id }
            }
          ],
          status: 'ACCEPTED',
          activityType: 'MODERATION',
          withActivity: true,
          withUpdate: true,
          updateRef: update?.id || options?.updateRef
        });

        if (options?.withActivity === undefined || options?.withActivity)
          activity = await CreateActivity('MODERATION', 'UPDATE_ANIME', {
            author: { id: options?.authorId || user.id },
            target: { id: findAnime.id },
            targetPath: 'Anime'
          }).catch(async (err) => {
            // Suppresion de l'update;
            update.deleteOne().catch(() => {});
            throw err;
          });
      } catch (err) {
        update?.deleteOne?.()?.catch(() => {});
        activity?.deleteOne?.()?.catch(() => {});

        if (wasUpdated)
          await findAnime
            .updateOne({ $set: findAnime.toJSON() }, { runValidators: true })
            .catch(() => {
              console.error(
                `La modification effectué sur l'anime ${findAnime.id} n'a pas pu être annulé.`
              );
            });

        console.error(err);
        throw new ErrorHandled("Une erreur s'est produite lors de la sauvegarde de l'anime");
      }
    }
  };
}
