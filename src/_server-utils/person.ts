
import { PersonModel } from "../_models/_personModel";
import { IPerson } from "../_types/personType";
import { IUser } from "../_types/userType";
import { ObjCheckChanged, ObjKeyToDotKey } from "../_utils/objectChecker";
import { IAdd_Person_ZOD, ICreate_Person_ZOD, PersonDataToZOD } from "../_validation/personZOD";
import { Document, Schema } from "mongoose";
import { CreateActivity } from "./activity";
import { ErrorHandled } from "./errorHandling";
import { BulkCreateMedias, IMediaDocTypeToSave } from "./media";
import { CreateUpdate } from "./update";

export type IPersonDoc = Document<unknown, {}, IPerson> & IPerson & Required<{ _id: Schema.Types.ObjectId; }>

const findPersonById = async (id: string) => {

  const find = await PersonModel.findOne({ id });
  if (!find) throw new ErrorHandled(`La personne ${id} est introuvable dans la base de données.`);
  return find;
}

type IPersonRelation = {
  id: string,
  role?: string
}

export async function PersonAddToRelation<
  TKey extends string,
  TOut extends Record<TKey, IPersonRelation[]>
>(
  addMultiple: IAdd_Person_ZOD[] | undefined,
  key: TKey,
  cb: (rel: { docs: IPersonDoc[] } & (TOut | Record<string, IPersonRelation[]>)) => void
) {
  try {

    if (!addMultiple)
      return; // Pas obligatoire;

    const persons: IPersonRelation[] = [];
    const docs: IPersonDoc[] = [];

    for await (const add of addMultiple) {
      let role = add.role;
      if (add?.id) {

        const { id } = await findPersonById(add.id);
        persons.push({ id, role });
      } else if (add.newPerson) {
        await CheckPersonUnique(add.newPerson.name.first, add.newPerson.name.last);
        const newPerson = new PersonModel(add.newPerson);
        await newPerson.validate();
        persons.push({ id: newPerson.id, role });
        docs.push(newPerson);
      } else {
        throw "Person object vide";
      }
    }

    cb({ docs, [key]: persons });
    return { docs, persons };
  } catch (err) {
    console.error(err);
    throw new ErrorHandled(`Une ou plusieurs personne ajoutée sont invalides`);
  }

}


export async function CheckPersonUnique(first: string, last: string, notId?: string) {
  let firstRegex = new RegExp("^" + first + "$", "i");
  let lastRegex = new RegExp("^" + last + "$", "i");

  const findPersonByName = await PersonModel.findOne({
    "name.first": firstRegex,
    "name.last": lastRegex,
  });

  if (notId && findPersonByName?.id === notId)
    return;

  if (findPersonByName)
    throw new ErrorHandled("Une personne est déjà enregistrer avec ce nom.");
}


export async function PersonSaveDB(props: Partial<ICreate_Person_ZOD>, user: IUser) {

  let mediasToSave: IMediaDocTypeToSave[] = [];

  const { ...addPerson } = props;
  const newPerson = { ...addPerson } as unknown as IPerson;

  console.log("Person création/modification en cours...")

  return {
    createRequest: async () => {

      const doc = new PersonModel(newPerson);
      let update: any, activity, wasCreated = false;

      try {

        doc.isVerified = false;

        await doc.validate();

        await doc.save();
        wasCreated = true;

        update = await CreateUpdate({
          type: "CREATE",
          actions: [{ label: "REQUEST", user: { id: user.id } }],
          changes: newPerson,
          author: { id: user.id },
          targetPath: "Person",
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

        activity = await CreateActivity("MEMBER", "REQUEST_PERSON", {
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

      const doc = new PersonModel(newPerson);
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
            targetPath: "Person",
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
          activity = await CreateActivity("MODERATION", "CREATE_PERSON", {
            author: { id: user.id },
            target: { id: doc.id },
            targetPath: "Person",
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
        throw new ErrorHandled("Une erreur s'est produite lors de la sauvegarde de la personnalité");
      }
    },
    update: async (id: string, options?: {
      withUpdate?: boolean
      withActivity?: boolean
      updateRef?: string
      authorId?: string
    }) => {
      const findPerson = await PersonModel.findOne({ id });
      if (!findPerson) throw new ErrorHandled("la personnalité est introuvable");

      const parseTOZOD = PersonDataToZOD(findPerson.toJSON());
      const newPersonTOZOD = PersonDataToZOD(newPerson);
      const { changes, befores } = ObjCheckChanged(parseTOZOD, newPersonTOZOD, ["id", "_id"]);

      if (!changes)
        throw new ErrorHandled("Aucune modification n'a été effectuee");


      let objLevel1 = ObjKeyToDotKey(changes) as any;

      let update: any, activity, wasUpdated = false;
      try {
        await findPerson.updateOne({ $set: objLevel1 }, { runValidators: true });
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
            target: { id: findPerson.id },
            targetPath: "Person",
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
          activity = await CreateActivity("MODERATION", "UPDATE_PERSON", {
            author: { id: options?.authorId || user.id },
            target: { id: findPerson.id },
            targetPath: "Person",
          }).catch(async (err) => {
            // Suppresion de l'update;
            update.deleteOne().catch(() => { });
            throw err;
          });

      } catch (err) {
        update?.deleteOne?.()?.catch(() => { });
        activity?.deleteOne?.()?.catch(() => { });

        if (wasUpdated)
          await findPerson.updateOne({ $set: findPerson.toJSON() }, { runValidators: true })
            .catch(() => {
              console.error(`La modification effectué sur la personnalité ${findPerson.id} n'a pas pu être annulé.`)
            });
        throw new ErrorHandled("Une erreur s'est produite lors de la sauvegarde de la personnalité");
      }
    },
  }

}
