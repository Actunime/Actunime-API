
import { GroupeModel } from "../_models/_groupeModel";
import type { IGroupe } from "../_types/groupeType";
import type { IUser } from "../_types/userType";
import { ObjCheckChanged, ObjKeyToDotKey } from "../_utils/objectChecker";
import { GroupeDataToZOD, type IAdd_Groupe_ZOD, type ICreate_Groupe_ZOD } from "../_validation/groupeZOD";
import { Document, Schema } from "mongoose";
import { CreateActivity } from "./activity";
import { ErrorHandled } from "./errorHandling";
import { BulkCreateMedias, type IMediaDocTypeToSave } from "./media";
import { CreateUpdate } from "./update";


type IGroupeDoc = Document<unknown, {}, IGroupe> & IGroupe & Required<{ _id: Schema.Types.ObjectId; }>

const findGroupeById = async (id: string) => {

  const find = await GroupeModel.findOne({ id });
  if (!find) throw new ErrorHandled("Le groupe est introuvable");
  return find;
}

export const GroupeAddToRelation = async (
  add: IAdd_Groupe_ZOD | undefined,
  cb: (rel: { doc?: IGroupeDoc, groupe: { id: string } }) => void
) => {
  if (add?.id) {

    const { id } = await findGroupeById(add.id);
    cb({ groupe: { id } });
    return { groupe: { id } };
  } else if (add?.newGroupe && Object.keys(add.newGroupe).length > 0) {
    await CheckGroupeUnique(add.newGroupe?.name);
    const newGroupe = new GroupeModel(add.newGroupe);
    await newGroupe.validate();
    cb({ doc: newGroupe, groupe: { id: newGroupe.id } });
    return {
      groupe: { id: newGroupe.id },
    }
  } else {
    throw new ErrorHandled("Groupe invalide");
  }
}

export async function CheckGroupeUnique(name: string, notId?: string) {

  let regex = new RegExp("^" + name + "$", "i");

  const findGroupeByName = await GroupeModel.findOne({
    name: regex,
  });

  if (notId && findGroupeByName?.id === notId)
    return;

  if (findGroupeByName)
    throw new ErrorHandled("Un groupe est déjà enregistrer avec ce nom.");
}

export async function GroupeSaveDB(props: Partial<ICreate_Groupe_ZOD>, user: IUser) {

  let mediasToSave: IMediaDocTypeToSave[] = [];

  const { ...addGroupe } = props;
  const newGroupe = { ...addGroupe } as unknown as IGroupe;

  console.log("Groupe création/modification en cours...")

  return {
    create: async (options?: {
      withUpdate?: boolean
      withActivity?: boolean
      updateRef?: string
    }) => {

      const doc = new GroupeModel(newGroupe);
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
            targetPath: "Groupe",
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
          activity = await CreateActivity("MODERATION", "CREATE_GROUPE", {
            author: { id: user.id },
            target: { id: doc.id },
            targetPath: "Groupe",
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
        throw new ErrorHandled("Une erreur s'est produite lors de la sauvegarde de le groupe");
      }
    },
    update: async (id: string, options?: {
      withUpdate?: boolean
      withActivity?: boolean
      updateRef?: string
      authorId?: string
    }) => {
      const findGroupe = await GroupeModel.findOne({ id });
      if (!findGroupe) throw new ErrorHandled("le groupe est introuvable");

      const parseTOZOD = GroupeDataToZOD(findGroupe.toJSON());
      const newGroupeTOZOD = GroupeDataToZOD(newGroupe);
      const { changes, befores } = ObjCheckChanged(parseTOZOD, newGroupeTOZOD, ["id", "_id"]);

      if (!changes)
        throw new ErrorHandled("Aucune modification n'a été effectuee");


      let objLevel1 = ObjKeyToDotKey(changes) as any;
      if (objLevel1.hasOwnProperty("title.default")) {
        await CheckGroupeUnique(objLevel1["title.default"], findGroupe.id);
      }
      let update: any, activity, wasUpdated = false;
      try {
        await findGroupe.updateOne({ $set: objLevel1 }, { runValidators: true });
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
            target: { id: findGroupe.id },
            targetPath: "Groupe",
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
          activity = await CreateActivity("MODERATION", "UPDATE_GROUPE", {
            author: { id: options?.authorId || user.id },
            target: { id: findGroupe.id },
            targetPath: "Groupe",
          }).catch(async (err) => {
            // Suppresion de l'update;
            update.deleteOne().catch(() => { });
            throw err;
          });

      } catch (err) {
        update?.deleteOne?.()?.catch(() => { });
        activity?.deleteOne?.()?.catch(() => { });

        if (wasUpdated)
          await findGroupe.updateOne({ $set: findGroupe.toJSON() }, { runValidators: true })
            .catch(() => {
              console.error(`La modification effectué sur le groupe ${findGroupe.id} n'a pas pu être annulé.`)
            });
        throw new ErrorHandled("Une erreur s'est produite lors de la sauvegarde de le groupe");
      }
    },
  }

}
