import { CompanyModel } from "../_models/_companyModel";
import { ICompany } from "../_types/companyType";
import { IUser } from "../_types/userType";
import { ObjCheckChanged, ObjKeyToDotKey } from "../_utils/objectChecker";
import { CompanyDataToZOD, IAdd_Company_ZOD, ICreate_Company_ZOD } from "../_validation/companyZOD";
import { Document, Schema } from "mongoose";
import { CreateActivity } from "./activity";
import { ErrorHandled } from "./errorHandling";
import { BulkCreateMedias, IMediaDocTypeToSave } from "./media";
import { CreateUpdate } from "./update";

type ICompanyDoc = Document<unknown, {}, ICompany> & ICompany & Required<{ _id: Schema.Types.ObjectId; }>

const findCompanyById = async (id: string) => {
  const find = await CompanyModel.findOne({ id });
  if (!find) throw new ErrorHandled("Le company est introuvable");
  return find;
}

export async function CompanyAddToRelation(
  addMultiple: IAdd_Company_ZOD[] | undefined,
  cb: (rel: { docs: ICompanyDoc[], companys: { id: string }[] }) => void
) {
  try {

    if (!addMultiple)
      return; // Pas obligatoire;

    const companys: { id: string }[] = [];
    const docs: ICompanyDoc[] = [];

    for await (const add of addMultiple) {
      if (add?.id) {
        const { id } = await findCompanyById(add.id);
        companys.push({ id });
      } else if (add.newCompany) {
        await CheckCompanyUnique(add.newCompany.name);
        const newCompany = new CompanyModel(add.newCompany);
        await newCompany.validate();
        companys.push({ id: newCompany.id });
        docs.push(newCompany);
      } else {
        throw "Company object vide";
      }
    }

    cb({ docs, companys });
    return { docs, companys };
  } catch (err) {
    console.error(err);
    throw new ErrorHandled(`Une ou plusieurs société ajoutée sont invalides`);
  }

}


export async function CheckCompanyUnique(name: string, notId?: string) {

  let regex = new RegExp("^" + name + "$", "i");

  const findCompanyByName = await CompanyModel.findOne({
    name: regex,
  });

  if (notId && findCompanyByName?.id === notId)
    return;

  if (findCompanyByName)
    throw new ErrorHandled("Une société est déjà enregistrer avec ce nom.");
}


export async function CompanySaveDB(props: Partial<ICreate_Company_ZOD>, user: IUser) {

  let mediasToSave: IMediaDocTypeToSave[] = [];

  const { ...addCompany } = props;
  const newCompany = { ...addCompany } as unknown as ICompany;

  console.log("Company création/modification en cours...")

  return {
    createRequest: async () => {

      const doc = new CompanyModel(newCompany);
      let update: any, activity, wasCreated = false;

      try {

        doc.isVerified = false;

        await doc.validate();

        await doc.save();
        wasCreated = true;

        update = await CreateUpdate({
          type: "CREATE",
          actions: [{ label: "REQUEST", user: { id: user.id } }],
          changes: newCompany,
          author: { id: user.id },
          targetPath: "Company",
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

        activity = await CreateActivity("MEMBER", "REQUEST_COMPANY", {
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

      const doc = new CompanyModel(newCompany);
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
            targetPath: "Company",
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
          activity = await CreateActivity("MODERATION", "CREATE_COMPANY", {
            author: { id: user.id },
            target: { id: doc.id },
            targetPath: "Company",
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
        throw new ErrorHandled("Une erreur s'est produite lors de la sauvegarde de la société");
      }
    },
    update: async (id: string, options?: {
      withUpdate?: boolean
      withActivity?: boolean
      updateRef?: string
      authorId?: string
    }) => {
      const findCompany = await CompanyModel.findOne({ id });
      if (!findCompany) throw new ErrorHandled("la société est introuvable");

      const parseTOZOD = CompanyDataToZOD(findCompany.toJSON());
      const newCompanyTOZOD = CompanyDataToZOD(newCompany);
      const { changes, befores } = ObjCheckChanged(parseTOZOD, newCompanyTOZOD, ["id", "_id"]);

      if (!changes)
        throw new ErrorHandled("Aucune modification n'a été effectuee");


      let objLevel1 = ObjKeyToDotKey(changes) as any;
      if (objLevel1.hasOwnProperty("name")) {
        await CheckCompanyUnique(objLevel1["name"], findCompany.id);
      }
      let update: any, activity, wasUpdated = false;
      try {
        await findCompany.updateOne({ $set: objLevel1 }, { runValidators: true });
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
            target: { id: findCompany.id },
            targetPath: "Company",
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
          activity = await CreateActivity("MODERATION", "UPDATE_COMPANY", {
            author: { id: options?.authorId || user.id },
            target: { id: findCompany.id },
            targetPath: "Company",
          }).catch(async (err) => {
            // Suppresion de l'update;
            update.deleteOne().catch(() => { });
            throw err;
          });

      } catch (err) {
        update?.deleteOne?.()?.catch(() => { });
        activity?.deleteOne?.()?.catch(() => { });

        if (wasUpdated)
          await findCompany.updateOne({ $set: findCompany.toJSON() }, { runValidators: true })
            .catch(() => {
              console.error(`La modification effectué sur la société ${findCompany.id} n'a pas pu être annulé.`)
            });
        throw new ErrorHandled("Une erreur s'est produite lors de la sauvegarde de la société");
      }
    },
  }

}
