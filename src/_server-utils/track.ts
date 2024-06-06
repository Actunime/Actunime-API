import { TrackModel } from '../_models/_trackModel';
import { ITrack } from '../_types/trackType';
import { IUser } from '../_types/userType';
import { ITargetPath } from '../_utils/global';
import { ObjCheckChanged, ObjKeyToDotKey } from '../_utils/objectChecker';
import { IAdd_Track_ZOD, ICreate_Track_ZOD, TrackDataToZOD } from '../_validation/trackZOD';
import { Document, Schema } from 'mongoose';
import { CreateActivity } from './activity';
import { ErrorHandled } from './errorHandling';
import { BulkCreateMedias, IMediaDocTypeToSave } from './media';
import { IPersonDoc, PersonAddToRelation } from './person';
import { CreateUpdate } from './update';

type ITrackDoc = Document<any, object, ITrack> & ITrack & Required<{ _id: Schema.Types.ObjectId }>;

const findTrackById = async (id: string) => {
  const find = await TrackModel.findOne({ id });
  if (!find) throw new ErrorHandled(`La musique ${id} est introuvable`);
  return find;
};

type ITrackRelation = {
  id: string;
};

type ITrackOutDoc = {
  doc: ITrackDoc | IPersonDoc;
  path: ITargetPath & ('Person' | 'Track');
};

export async function TrackAddToRelation(
  addMultiple: IAdd_Track_ZOD[],
  cb: (rel: { docs: ITrackOutDoc[] } & Record<'tracks', ITrackRelation[]>) => void
) {
  try {
    if (!addMultiple) return; // Pas obligatoire;

    const tracks: ITrackRelation[] = [];
    let docs: ITrackOutDoc[] = [];

    for await (const add of addMultiple) {
      if (add?.id) {
        const { id } = await findTrackById(add.id);
        tracks.push({ id });
      } else if (add.newTrack) {
        // await CheckTrackUnique(add.newTrack.name);

        const newTrack = new TrackModel(add.newTrack);

        await PersonAddToRelation(
          add.newTrack.artists,
          'artists',
          ({ docs: personDocs, artists }) => {
            docs = docs.concat(personDocs.map((doc) => ({ doc, path: 'Person' })));
            newTrack.artists = artists;
          }
        );

        await newTrack.validate();

        tracks.push({ id: newTrack.id });

        docs.push({ doc: newTrack, path: 'Track' });
      } else {
        throw 'Track object vide';
      }
    }

    cb({ docs, tracks });

    return { docs, tracks };
  } catch (err) {
    console.error(err);
    throw new ErrorHandled(`Une ou plusieurs musiques ajoutée sont invalides`);
  }
}

// export async function CheckTrackUnique(name: string) {
//   let regex = new RegExp("^" + name + "$", "i");

//   const findTrackByName = await TrackModel.exists({
//     name: regex,
//   });

//   if (findTrackByName)
//     throw new ErrorHandled("Une musique est déjà enregistrer avec ce nom.");
// }

export async function TrackSaveDB(props: Partial<ICreate_Track_ZOD>, user: IUser) {
  let mediasToSave: IMediaDocTypeToSave[] = [];

  const { artists, ...addTrack } = props;
  const newTrack = { ...addTrack } as any as ITrack;

  console.log('Track création/modification en cours...');

  // Gestion des acteurs
  await PersonAddToRelation(artists, 'artists', ({ docs, artists }) => {
    if (docs)
      mediasToSave = mediasToSave.concat(
        docs.map((doc) => {
          console.log('Person (artist) (nouveau): ', doc.id, doc.name);
          return { doc, path: 'Person' };
        })
      );
    console.log('Person(s) (actor) (assigné): ', artists.map((staff) => staff.id).join(', '));
    Object.assign(addTrack, { artists });
  });

  return {
    createRequest: async () => {
      const doc = new TrackModel(newTrack);
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
          changes: newTrack,
          author: { id: user.id },
          targetPath: 'Track',
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

        activity = await CreateActivity('MEMBER', 'REQUEST_TRACK', {
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
        console.log(err);
        throw new ErrorHandled("Une erreur s'est produite lors de la sauvegarde de la demande");
      }
    },
    create: async (options?: {
      withUpdate?: boolean;
      withActivity?: boolean;
      updateRef?: string;
    }) => {
      const doc = new TrackModel(newTrack);
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
            targetPath: 'Track',
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
          activity = await CreateActivity('MODERATION', 'CREATE_TRACK', {
            author: { id: user.id },
            target: { id: doc.id },
            targetPath: 'Track'
          }).catch(async (err) => {
            update.deleteOne().catch(() => {});
            throw err;
          });
      } catch (err) {
        if (wasCreated) await doc.deleteOne().catch(() => {});
        if (update) await update.deleteOne().catch(() => {});
        if (activity) await activity.deleteOne().catch(() => {});
        console.log(err);
        throw new ErrorHandled("Une erreur s'est produite lors de la sauvegarde de la musique");
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
      const findTrack = await TrackModel.findOne({ id });
      if (!findTrack) throw new ErrorHandled('musique est introuvable');

      const parseTOZOD = TrackDataToZOD(findTrack.toJSON());
      const newTrackTOZOD = TrackDataToZOD(newTrack);
      const { changes, befores } = ObjCheckChanged(parseTOZOD, newTrackTOZOD, ['id', '_id']);

      if (!changes) throw new ErrorHandled("Aucune modification n'a été effectuee");

      const objLevel1 = ObjKeyToDotKey(changes) as any;

      let update: any,
        activity,
        wasUpdated = false;
      try {
        await findTrack.updateOne({ $set: objLevel1 }, { runValidators: true });
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
            target: { id: findTrack.id },
            targetPath: 'Track',
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
          activity = await CreateActivity('MODERATION', 'UPDATE_TRACK', {
            author: { id: options?.authorId || user.id },
            target: { id: findTrack.id },
            targetPath: 'Track'
          }).catch(async (err) => {
            // Suppresion de l'update;
            update.deleteOne().catch(() => {});
            throw err;
          });
      } catch (err) {
        update?.deleteOne?.()?.catch(() => {});
        activity?.deleteOne?.()?.catch(() => {});

        if (wasUpdated)
          await findTrack
            .updateOne({ $set: findTrack.toJSON() }, { runValidators: true })
            .catch(() => {
              console.error(
                `La modification effectué sur musique ${findTrack.id} n'a pas pu être annulé.`
              );
            });
        throw new ErrorHandled("Une erreur s'est produite lors de la sauvegarde de la musique");
      }
    }
  };
}
