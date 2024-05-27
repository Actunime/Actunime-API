
import { MangaModel } from "../_models/_mangaModel";
import { IManga } from "../_types/mangaType";
import { IUser } from "../_types/userType";
import { ObjCheckChanged, ObjKeyToDotKey } from "../_utils/objectChecker";
import { IAdd_Manga_ZOD, ICreate_Manga_ZOD, MangaDataToZOD } from "../_validation/mangaZOD";
import { CreateActivity } from "./activity";
import { CharacterAddToRelation } from "./character";
import { CompanyAddToRelation } from "./company";
import { ErrorHandled } from "./errorHandling";
import { GroupeAddToRelation } from "./groupe";
import { BulkCreateMedias, IMediaDocTypeToSave } from "./media";
import { PersonAddToRelation } from "./person";
import { TrackAddToRelation } from "./track";
import { CreateUpdate } from "./update";

const findMangaById = async (id: string) => {

  const find = await MangaModel.findOne({ id });
  if (!find) throw new ErrorHandled("Le manga est introuvable");
  return find;
}

export async function MangaAddToRelation<
  TKey extends string,
  TOut extends Record<TKey, { id: string }>
>(
  add: IAdd_Manga_ZOD | undefined,
  key: TKey & keyof TOut,
  cb: (rel: TOut | { [key: string]: { id: string } }) => void
) {
  if (!add || !Object.keys(add).length)
    return; // Pas obligatoire;
  if (add?.id) {

    const { id } = await findMangaById(add.id);
    cb({ [key]: { id } });
    return { [key]: { id } };
  } else {
    throw new ErrorHandled(`Manga (${key}) invalide`);
  }
}

export async function CheckMangaUnique(name: string, notId?: string) {
  let regex = new RegExp("^" + name + "$", "i");

  const findMangaByName = await MangaModel.findOne({
    "title.default": regex,
  });

  if (notId && findMangaByName?.id === notId)
    return;

  if (findMangaByName)
    throw new ErrorHandled("Un manga est déjà enregistrer avec ce nom.");
}


export async function MangaSaveDB(props: Partial<ICreate_Manga_ZOD>, user: IUser) {

  // Initialisation des medias à sauvegarder
  let mediasToSave: IMediaDocTypeToSave[] = [];

  const { groupe, parent, source, companys, staffs, characters, tracks, ...addManga } = props;
  const newManga = { ...addManga } as unknown as IManga;

  console.log("Manga création/modification en cours...")

  //? Gestion des Groupes
  await GroupeAddToRelation(groupe,
    ({ doc, groupe }) => {
      if (doc) {
        mediasToSave.push({ doc, path: "Groupe" });
        console.log("Groupe (nouveau): ", doc.id, doc.name);
      }
      console.log("Groupe (assigné): ", groupe.id);
      Object.assign(newManga, { groupe });
    });

  //? Gestion Parent
  await MangaAddToRelation(parent, "parent", ({ parent }) => {
    console.log("Parent (manga) (assigné): ", parent.id);
    Object.assign(newManga, { parent });
  })

  //? Gestion Source
  await MangaAddToRelation(source, "source", ({ source }) => {
    console.log("Source (manga) (assigné): ", source.id);
    Object.assign(newManga, { source });
  })

  // //? Gestion Companys
  await CompanyAddToRelation(companys, ({ docs, companys }) => {
    if (docs) mediasToSave = mediasToSave.concat(
      docs.map((doc) => {
        console.log("Company (nouveau): ", doc.id, doc.name);
        return { doc, path: "Company" }
      })
    );
    console.log("Company(s) (assigné): ", companys.map((company) => company.id).join(', '));
    Object.assign(newManga, { companys });
  })

  //? Gestion Staffs
  await PersonAddToRelation(staffs, "staffs", ({ docs, staffs }) => {
    if (docs) mediasToSave = mediasToSave.concat(
      docs.map((doc) => {
        console.log("Person (staff) (nouveau): ", doc.id, doc.name);
        return { doc, path: "Person" }
      })
    );
    console.log("Person(s) (staff) (assigné): ", staffs.map((staff) => staff.id).join(', '));
    Object.assign(newManga, { staffs });
  })

  // //? Gestion Characters
  await CharacterAddToRelation(characters, ({ docs, characters }) => {
    mediasToSave = mediasToSave.concat(docs.map((toSave) => {
      console.log(`${toSave.path === 'Character' ? 'Character' : 'Character Person (Actor)'} (nouveau): `, toSave.doc.id, toSave.doc.name);
      return toSave
    }));
    console.log("Character(s) (assigné): ", characters.map((character) => character.id).join(', '));
    Object.assign(newManga, { characters });
  })

  //? Gestion Tracks
  await TrackAddToRelation(tracks || [], ({ docs, tracks }) => {
    mediasToSave = mediasToSave.concat(docs.map((toSave) => {
      console.log(`${toSave.path === 'Track' ? 'Track' : 'Track Person (Artist)'} (nouveau): `, toSave.doc.id, toSave.doc.name);
      return toSave
    }));
    console.log("Track(s) (assigné): ", tracks.map((track) => track.id).join(', '));
    Object.assign(newManga, { tracks });
  })

  return {
    createRequest: async () => {

      const doc = new MangaModel(newManga);
      let update: any, activity, wasCreated = false;

      try {

        doc.isVerified = false;

        await doc.validate();

        await doc.save();
        wasCreated = true;

        update = await CreateUpdate({
          type: "CREATE",
          actions: [{ label: "REQUEST", user: { id: user.id } }],
          changes: newManga,
          author: { id: user.id },
          targetPath: "Manga",
          status: "PENDING"
        })

        await BulkCreateMedias({
          medias: mediasToSave,
          authorId: user.id,
          actions: [{ label: "REQUEST", user: { id: user.id } }],
          status: "PENDING",
          activityType: "MEMBER",
          updateRef: update.id
        });

        activity = await CreateActivity("MEMBER", "REQUEST_MANGA", {
          author: { id: user.id },
          target: { id: update.id },
          targetPath: "Update",
        }).catch(async (err) => {
          update.deleteOne().catch(() => { });
          throw err;
        });

      } catch (err) {
        if (wasCreated)
          await doc.deleteOne().catch(() => { });
        if (update)
          await update.deleteOne().catch(() => { });
        if (activity)
          await activity.deleteOne().catch(() => { });
        console.log(err);
        throw new ErrorHandled("Une erreur s'est produite lors de la sauvegarde de la demande");
      }

    },
    create: async (options?: {
      withUpdate?: boolean
      withActivity?: boolean
      updateRef?: string
    }) => {

      const doc = new MangaModel(newManga);
      let update: any, activity, wasCreated = false;

      try {

        doc.isVerified = true;

        await doc.validate();

        await doc.save();
        wasCreated = true;

        if (options?.withUpdate === undefined || options?.withUpdate)
          update = await CreateUpdate({
            type: "CREATE",
            actions: [{
              label: "DIRECT_ACCEPT",
              user: { id: user.id }
            }],
            author: { id: user.id },
            target: { id: doc.id },
            targetPath: "Manga",
            status: "ACCEPTED",
            ref: options?.updateRef && { id: options?.updateRef } || undefined
          })

        await BulkCreateMedias({
          medias: mediasToSave,
          authorId: user.id,
          actions: [{
            label: "DIRECT_ACCEPT",
            user: { id: user.id }
          }],
          status: "ACCEPTED",
          activityType: "MODERATION",
          withActivity: true,
          withUpdate: true,
          updateRef: update?.id || options?.updateRef
        });

        if (options?.withActivity === undefined || options?.withActivity)
          activity = await CreateActivity("MODERATION", "CREATE_MANGA", {
            author: { id: user.id },
            target: { id: doc.id },
            targetPath: "Manga",
          }).catch(async (err) => {
            update.deleteOne().catch(() => { });
            throw err;
          });

      } catch (err) {
        if (wasCreated)
          await doc.deleteOne().catch(() => { });
        if (update)
          await update.deleteOne().catch(() => { });
        if (activity)
          await activity.deleteOne().catch(() => { });
        console.log(err);
        throw new ErrorHandled("Une erreur s'est produite lors de la sauvegarde du manga");
      }
    },
    update: async (id: string, options?: {
      withUpdate?: boolean
      withActivity?: boolean
      updateRef?: string
      authorId?: string
    }) => {
      const findManga = await MangaModel.findOne({ id });
      if (!findManga) throw new ErrorHandled("le manga est introuvable");

      const parseTOZOD = MangaDataToZOD(findManga.toJSON());
      const newMangaTOZOD = MangaDataToZOD(newManga);
      const { changes, befores } = ObjCheckChanged(parseTOZOD, newMangaTOZOD, ["id", "_id"]);

      if (!changes)
        throw new ErrorHandled("Aucune modification n'a été effectuee");


      let objLevel1 = ObjKeyToDotKey(changes) as any;
      if (objLevel1.hasOwnProperty("title.default")) {
        await CheckMangaUnique(objLevel1["title.default"], findManga.id);
      }
      let update: any, activity, wasUpdated = false;
      try {
        await findManga.updateOne({ $set: objLevel1 }, { runValidators: true });
        wasUpdated = true;

        if (options?.withUpdate === undefined || options?.withUpdate)
          update = await CreateUpdate({
            type: "UPDATE",
            actions: [{
              label: "DIRECT_ACCEPT",
              user: { id: user.id }
            }],
            author: { id: options?.authorId || user.id },
            changes,
            beforeChanges: befores,
            target: { id: findManga.id },
            targetPath: "Manga",
            status: "ACCEPTED",
            ref: options?.updateRef && { id: options?.updateRef } || undefined
          })

        await BulkCreateMedias({
          medias: mediasToSave,
          authorId: options?.authorId || user.id,
          actions: [{
            label: "DIRECT_ACCEPT",
            user: { id: user.id }
          }],
          status: "ACCEPTED",
          activityType: "MODERATION",
          withActivity: true,
          withUpdate: true,
          updateRef: update?.id || options?.updateRef
        });

        if (options?.withActivity === undefined || options?.withActivity)
          activity = await CreateActivity("MODERATION", "UPDATE_MANGA", {
            author: { id: options?.authorId || user.id },
            target: { id: findManga.id },
            targetPath: "Manga",
          }).catch(async (err) => {
            // Suppresion de l'update;
            update.deleteOne().catch(() => { });
            throw err;
          });

      } catch (err) {
        update?.deleteOne?.()?.catch(() => { });
        activity?.deleteOne?.()?.catch(() => { });

        if (wasUpdated)
          await findManga.updateOne({ $set: findManga.toJSON() }, { runValidators: true })
            .catch(() => {
              console.error(`La modification effectué sur le manga ${findManga.id} n'a pas pu être annulé.`)
            });
        throw new ErrorHandled("Une erreur s'est produite lors de la sauvegarde du manga");
      }
    },
  }

}
