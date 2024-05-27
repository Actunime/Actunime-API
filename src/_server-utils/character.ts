
import { CharacterModel } from "../_models/_characterModel";
import type { ICharacter } from "../_types/characterType";
import type { IUser } from "../_types/userType";
import type { ITargetPath } from "../_utils/global";
import { ObjCheckChanged, ObjKeyToDotKey } from "../_utils/objectChecker";
import { CharacterDataToZOD, IAdd_Character_ZOD, ICreate_Character_ZOD } from "../_validation/characterZOD";
import { Document, Schema } from "mongoose";
import { CreateActivity } from "./activity";
import { ErrorHandled } from "./errorHandling";
import { BulkCreateMedias, type IMediaDocTypeToSave } from "./media";
import { PersonAddToRelation, type IPersonDoc } from "./person";
import { CreateUpdate } from "./update";

type ICharacterDoc = Document<unknown, {}, ICharacter> & ICharacter & Required<{ _id: Schema.Types.ObjectId; }>

const findCharacterById = async (id: string) => {

  const find = await CharacterModel.findOne({ id });
  if (!find) throw new ErrorHandled(`Le personnage ${id} est introuvable`);
  return find;
}

type ICharacterRelation = {
  id: string,
  role?: string
}

type ICharacterOutDoc = {
  doc: ICharacterDoc | IPersonDoc,
  path: ITargetPath & ("Person" | "Character")
}

export async function CharacterAddToRelation(
  addMultiple: IAdd_Character_ZOD[] | undefined,
  cb: (rel: { docs: ICharacterOutDoc[] } & Record<"characters", ICharacterRelation[]>) => void
) {
  try {

    if (!addMultiple)
      return; // Pas obligatoire;

    const characters: ICharacterRelation[] = [];
    let docs: ICharacterOutDoc[] = [];

    for await (const add of addMultiple) {
      let role = add.role;
      if (add?.id) {

        const { id } = await findCharacterById(add.id);
        characters.push({ id, role });
      } else if (add.newCharacter) {

        await CheckCharacterUnique(add.newCharacter.name.first, add.newCharacter.name.last);

        const newCharacter = new CharacterModel(add.newCharacter);

        await PersonAddToRelation(add.newCharacter.actors, "actors",
          ({ docs: personDocs, actors }) => {
            docs = docs.concat(personDocs.map(doc => ({ doc, path: "Person" })));
            newCharacter.actors = actors;
          })

        await newCharacter.validate();

        characters.push({ id: newCharacter.id, role });

        docs.push({ doc: newCharacter, path: "Character" });

      } else {
        throw "Character object vide";
      }
    }

    cb({ docs, characters });

    return { docs, characters };
  } catch (err) {
    console.error(err);
    throw new ErrorHandled(`Un ou plusieurs personnage ajoutée sont invalides`);
  }

}
export async function CheckCharacterUnique(first: string, last?: string) {
  let regexFirst = new RegExp("^" + first + "$", "i");
  let regexLast = new RegExp("^" + last + "$", "i");

  const findCharacterByName = await CharacterModel.findOne({
    "name.first": regexFirst,
    "name.last": regexLast,
  });

  if (findCharacterByName)
    throw new ErrorHandled("Un personnage est déjà enregistrer avec ce nom.");
}



export async function CharacterSaveDB(props: Partial<ICreate_Character_ZOD>, user: IUser) {

  let mediasToSave: IMediaDocTypeToSave[] = [];

  const { actors, ...addCharacter } = props;
  const newCharacter = { ...addCharacter } as unknown as ICharacter;

  console.log("Character création/modification en cours...")

  // Gestion des acteurs
  await PersonAddToRelation(actors, "actors", ({ docs, actors }) => {
    if (docs) mediasToSave = mediasToSave.concat(
      docs.map((doc) => {
        console.log("Person (actor) (nouveau): ", doc.id, doc.name);
        return { doc, path: "Person" }
      })
    );
    console.log("Person(s) (actor) (assigné): ", actors.map((staff) => staff.id).join(', '));
    Object.assign(newCharacter, { actors });
  })

  return {
    createRequest: async () => {

      const doc = new CharacterModel(newCharacter);
      let update: any, activity, wasCreated = false;

      try {

        doc.isVerified = false;

        await doc.validate();

        await doc.save();
        wasCreated = true;

        update = await CreateUpdate({
          type: "CREATE",
          actions: [{ label: "REQUEST", user: { id: user.id } }],
          changes: newCharacter,
          author: { id: user.id },
          targetPath: "Character",
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

        activity = await CreateActivity("MEMBER", "REQUEST_CHARACTER", {
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

      const doc = new CharacterModel(newCharacter);
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
            targetPath: "Character",
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
          activity = await CreateActivity("MODERATION", "CREATE_CHARACTER", {
            author: { id: user.id },
            target: { id: doc.id },
            targetPath: "Character",
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
        throw new ErrorHandled("Une erreur s'est produite lors de la sauvegarde de le peronnsage");
      }
    },
    update: async (id: string, options?: {
      withUpdate?: boolean
      withActivity?: boolean
      updateRef?: string
      authorId?: string
    }) => {
      const findCharacter = await CharacterModel.findOne({ id });
      if (!findCharacter) throw new ErrorHandled("Le personnage est introuvable");

      const parseTOZOD = CharacterDataToZOD(findCharacter.toJSON());
      const newCharacterTOZOD = CharacterDataToZOD(newCharacter);
      const { changes, befores } = ObjCheckChanged(parseTOZOD, newCharacterTOZOD, ["id", "_id"]);

      if (!changes)
        throw new ErrorHandled("Aucune modification n'a été effectuee");

      console.log("modifications", changes, user, findCharacter.id);

      let objLevel1 = ObjKeyToDotKey(changes) as any;

      let update: any, activity, wasUpdated = false;
      try {
        await findCharacter.updateOne({ $set: objLevel1 }, { runValidators: true });
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
            target: { id: findCharacter.id },
            targetPath: "Character",
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
          activity = await CreateActivity("MODERATION", "UPDATE_CHARACTER", {
            author: { id: options?.authorId || user.id },
            target: { id: findCharacter.id },
            targetPath: "Character",
          }).catch(async (err) => {
            // Suppresion de l'update;
            update.deleteOne().catch(() => { });
            throw err;
          });

      } catch (err) {
        console.error(err);
        update?.deleteOne?.()?.catch(() => { });
        activity?.deleteOne?.()?.catch(() => { });

        if (wasUpdated)
          await findCharacter.updateOne({ $set: findCharacter.toJSON() }, { runValidators: true })
            .catch(() => {
              console.error(`La modification effectué sur le peronnsage ${findCharacter.id} n'a pas pu être annulé.`)
            });
        throw new ErrorHandled("Une erreur s'est produite lors de la sauvegarde de le peronnsage");
      }
    },
  }

}
