import { ClientSession, Document } from "mongoose";
import { PatchModel } from "@actunime/mongoose-models";
import { IPatch, IUser, IPaginationResponse, ActivityActionObj, PatchTypeObj, TargetPathObj } from "@actunime/types";
import { IPatch_Pagination_ZOD, IAddChangesToPatch_ZOD, IAcceptChangesToPatch_ZOD, IDenyChangesToPatch_ZOD } from "@actunime/validations";
import { MediaPagination } from "./pagination";
import { APIError } from "./Error";
import { ModelsPath } from "./modelByPath";
import { DevLog } from "@actunime/utils";
import { DiscordWebhook, MessageBuilder } from "../_utils/_discordWebhook";
import { ActivityManager } from "./activity";
import { ManagerByPath } from "./managerByPath";
import { ImageManager } from "./image";

class PatchManager {
  public session: ClientSession;
  public user?: IUser;
  public activityManager: ActivityManager;

  constructor(session: ClientSession, options: { user?: IUser }) {
    this.user = options.user;
    this.session = session;
    this.activityManager = new ActivityManager(this.session, options);
  }

  private async populate(
    doc: Document | IPaginationResponse<IPatch>,
    withMedia: IPatch_Pagination_ZOD["with"],
  ) {
    if (withMedia?.actions)
      await PatchModel.populate(doc, {
        path: "actions.user.data",
        select: "-_id",
        justOne: true,
        options: { session: this.session },
      });
    if (withMedia?.author)
      await PatchModel.populate(doc, {
        path: "author.data",
        select: "-_id",
        justOne: true,
        options: { session: this.session },
      });


    if (doc["targetPath"] === "Update") {
      doc["targetPath"] = "Patch";
      PatchModel.updateOne?.({ id: (doc as any).id }, { targetPath: "Patch" }).then(() => {
        DevLog("Update targetPath", "warn");
      });
    }

    if (withMedia?.target) {
      await PatchModel.populate(doc, {
        path: "target.data",
        select: "-_id",
        justOne: true,
        options: { session: this.session },
      });

    }
  }

  public async get(id: string, withMedia?: IPatch_Pagination_ZOD["with"]) {
    const findPatch = await PatchModel.findOne({ id }, null, {
      session: this.session,
    }).select("-_id");

    if (!findPatch) throw new Error("Patch not found");

    if (withMedia) await this.populate(findPatch, withMedia);

    return findPatch.toJSON();
  }

  public async filter(paginationInput: IPatch_Pagination_ZOD) {
    const pagination = new MediaPagination({ model: PatchModel });

    pagination.setPagination({
      page: paginationInput.page,
      limit: paginationInput.limit,
    });

    const query = paginationInput.query;
    const sort = paginationInput.sort;

    if (paginationInput.strict) {
      pagination.setStrict(paginationInput.strict);
    }

    pagination.addSearchQuery([
      ...(query?.status
        ? [
          Array.isArray(query.status)
            ? { status: { $in: query.status } }
            : { status: query.status },
        ]
        : []),
      ...(query?.actionLabel ? [{ "actions.label": query.actionLabel }] : []),
      ...(query?.actionUser ? [{ "actions.user.id": query.actionUser }] : []),
      ...(query?.type
        ? [
          Array.isArray(query.type)
            ? { type: { $in: query.type } }
            : { type: query.type },
        ]
        : []),
      ...(query?.author ? [{ "author.id": query.author }] : []),
      ...(query?.target ? [{ "target.id": query.target }] : []),
      ...(query?.targetPath
        ? [
          Array.isArray(query.targetPath)
            ? { targetPath: { $in: query.targetPath } }
            : { targetPath: query.targetPath },
        ]
        : []),
      ...(query?.ref ? [{ "ref.id": query.ref }] : []),
    ]);

    if (sort) pagination.setSort(sort);

    const response = await pagination.getResults(true);

    if (paginationInput.with)
      await this.populate(response, paginationInput.with);

    return response;
  }

  async PatchCreate(args: Partial<IPatch>) {
    const newPatch = new PatchModel(args);
    await newPatch.save({ session: this.session });
  }

  static async PatchCreate(args: Partial<IPatch>, session?: ClientSession) {
    const newPatch = new PatchModel(args);
    await newPatch.save({ session });
  }



  public async patch(props: IAddChangesToPatch_ZOD) {
    if (!this.user)
      throw new APIError("Utilisateur non défini obligatoire pour une modification", "NOT_FOUND", 400);

    const findPatch = await PatchModel
      .findOne({ id: props.id })
      .populate("author.data")
      .session(this.session);

    if (!findPatch)
      throw new APIError(
        "Aucun patch correspondant à cet identifiant",
        "NOT_FOUND",
        404,
      );

    if (findPatch.ref?.id)
      throw new APIError(
        "Vous pouvez modifier que les modifications sans références",
        "FORBIDDEN",
        403,
      );

    if (!findPatch.type.endsWith("REQUEST"))
      throw new APIError(
        "Cette modification ne peut pas être modifié car elle n'est pas de type demande",
        "FORBIDDEN",
        403,
      )

    if (findPatch.status !== "PENDING")
      throw new APIError(
        "Cette modification ne peut pas être modifié car elle n'est pas en attente",
        "FORBIDDEN",
        403,
      )

    // Vérification des données par le model
    const Manager = new (ManagerByPath(findPatch.targetPath))(this.session, {
      user: this.user,
      isRequest: true
    });

    await Manager.init(props.data);

    if (!findPatch.target?.id)
      throw new APIError(
        "La modification n'a pas de cible",
        "NOT_FOUND",
        404,
      )

    const findTargetMedia = await Manager.get(findPatch.target?.id);
    if (!findTargetMedia)
      throw new APIError(
        "Erreur problématique le media cible n'existe plus ?",
        "NOT_FOUND",
        404,
      );

    // const updatedVersion = await Manager.patch(findPatch.target?.id)

    const changes = await Manager.getChanges(findPatch.target?.id);
    console.log("Modifications", changes);

    // const changes = getChangedDataV2(findPatch.newValues, updatedVersion?.toJSON());

    if (!changes.newValues)
      throw new APIError(
        "Aucun changement n'a été détecté",
        "EMPTY_CHANGES",
        400,
      );

    await findPatch.updateOne({
      $set: {
        newValues: {
          ...findPatch.newValues,
          ...changes.newValues
        }
      }
    })

    await Manager.patch(findPatch.target?.id)

    await this.PatchCreate({
      status: "ACCEPTED",
      type: "PATCH",
      note: props.note,
      target: { id: findPatch.id },
      targetPath: "Patch",
      ref: { id: findPatch.id },
      author: { id: this.user.id },
      oldValues: changes?.oldValues,
      newValues: changes?.newValues,
    })

    const action = "UPDATE_" + findPatch.type + "_" + findPatch.targetPath.toUpperCase() as keyof typeof ActivityActionObj

    await this.activityManager
      .CreateActivity(
        "MODERATION",
        action,
        {
          author: { id: this.user.id },
          target: { id: findPatch.id },
          targetPath: "Patch",
        },
      );

    // DiscordWebhook.info(`${PatchTypeObj[findPatch.type]} | ${findPatch.targetPath} (${findPatch.target?.id})`, `Modification ID: ${findPatch.target?.id} - un modérateurs apporte des modifications supplémentaires, (note: ${props.note})`, `Modérateur: ${this.user?.username} (${this.user?.id})`);

    const embed = new MessageBuilder()
      .setTitle(`${PatchTypeObj[findPatch.type]} | ${TargetPathObj[findPatch.targetPath]} (${findPatch.target?.id})`)
      .setColor(0xff9900)
      .addField("Modérateur apportant des modifications", `${this.user?.username} (${this.user?.id})`)
      .addField("Auteur original", `${findPatch.author?.data?.username} (${findPatch.author?.data?.id})`)
      .setDescription(`Des modifications supplémentaires à une **${PatchTypeObj[findPatch.type]}** pour un **${TargetPathObj[findPatch.targetPath]}** ont été apportées par un modérateur.`)
      .setFooter('Actunime API | Logs')
      .setTimestamp();

    if (props.note)
      embed.addField("Note modérateur", props.note)

    await DiscordWebhook.send(embed);
  }

  public async acceptPatch(props: IAcceptChangesToPatch_ZOD) {
    if (!this.user)
      throw new APIError("Utilisateur non défini obligatoire pour une modification", "NOT_FOUND", 400);

    const findPatch = await PatchModel
      .findOne({ id: props.id })
      .populate("author.data")
      .session(this.session);

    if (!findPatch)
      throw new APIError(
        "Aucun patch correspondant à cet identifiant",
        "NOT_FOUND",
        404,
      );

    if (findPatch.ref?.id)
      throw new APIError(
        "Vous pouvez accepter que les modifications sans références",
        "FORBIDDEN",
        403,
      );

    if (!findPatch.type.endsWith("REQUEST"))
      throw new APIError(
        "Cette modification ne peut pas être acceptée car elle n'est pas de type demande",
        "FORBIDDEN",
        403,
      )

    if (findPatch.status !== "PENDING")
      throw new APIError(
        "Cette modification ne peut pas être acceptée car elle n'est pas en attente",
        "FORBIDDEN",
        403,
      )

    // Vérification des données par le model
    const Model = await ModelsPath(findPatch.targetPath);

    const findTargetMedia = await Model.findOne({ id: findPatch.target?.id });
    if (!findTargetMedia)
      throw new APIError(
        "Erreur problématique le media cible n'existe plus ?",
        "NOT_FOUND",
        404,
      );

    await findPatch.updateOne({
      status: "ACCEPTED",
      moderatorNote: props.moderatorNote,
      oldValues: findTargetMedia.toJSON()
    })

    if (!findTargetMedia.isVerified) {
      findPatch.newValues.isVerified = true;
      DevLog(`Le média de type ${findPatch.targetPath} est maintenant verifié ! (id: ${findPatch.target?.id}}`, "debug");
    }

    await findTargetMedia
      .updateOne(findPatch.newValues)
      .session(this.session);

    const action = "ACCEPT_" + findPatch.type + "_" + findPatch.targetPath.toUpperCase() as keyof typeof ActivityActionObj

    await this.activityManager
      .CreateActivity(
        "MODERATION",
        action,
        {
          author: { id: this.user.id },
          target: { id: findPatch.id },
          targetPath: "Patch",
        },
      );

    // DiscordWebhook.success(`${PatchTypeObj[findPatch.type]} | ${findPatch.targetPath} (${findPatch.target?.id})`, `Modification ID: ${findPatch.target?.id} - acceptation par un modérateur`, `Modérateur: ${this.user?.username} (${this.user?.id}), ajouté par ${findPatch.author?.data?.username} (${findPatch.author?.id})`);

    const embed = new MessageBuilder()
      .setTitle(`${PatchTypeObj[findPatch.type]} | ${TargetPathObj[findPatch.targetPath]} (${findPatch.target?.id})`)
      .setColor(0x00ff00)
      .addField("Modérateur qui accepte les modifications", `${this.user?.username} (${this.user?.id})`)
      .addField("Auteur original", `${findPatch.author?.data?.username} (${findPatch.author?.data?.id})`)
      .setDescription(`Un modérateur a accepté une **${PatchTypeObj[findPatch.type]}** pour un(e) **${TargetPathObj[findPatch.targetPath]}**.`)
      .setFooter('Actunime API | Logs')
      .setTimestamp();

    // Provoque une erreur setUrl pas défini fonction invalide;
    // if (findPatch.targetPath === "Anime")
    //   embed.setUrl(`https//actunime.fr/${findPatch.targetPath.toLowerCase()}s/${findPatch.target?.id}`)

    if (findPatch.targetPath === "Image")
      embed.setImage(`https://img.actunime.fr/${findPatch.targetPath.toLowerCase()}s/${findPatch.target?.id}.webp`)

    if (props.moderatorNote)
      embed.addField("Note modérateur", props.moderatorNote)

    await DiscordWebhook.send(embed);
  }

  public async denyPatch(props: IDenyChangesToPatch_ZOD) {
    if (!this.user)
      throw new APIError("Utilisateur non défini obligatoire pour une modification", "NOT_FOUND", 400);

    const findPatch = await PatchModel
      .findOne({ id: props.id })
      .populate("author.data")
      .session(this.session);

    if (!findPatch)
      throw new APIError(
        "Aucun patch correspondant à cet identifiant",
        "NOT_FOUND",
        404,
      );

    if (findPatch.ref?.id)
      throw new APIError(
        "Vous pouvez refuser que les modifications sans références",
        "FORBIDDEN",
        403,
      );

    if (!findPatch.type.endsWith("REQUEST"))
      throw new APIError(
        "Cette modification ne peut pas être refusée car elle n'est pas de type demande",
        "FORBIDDEN",
        403,
      )

    if (findPatch.status !== "PENDING")
      throw new APIError(
        "Cette modification ne peut pas être refusée car elle n'est pas en attente",
        "FORBIDDEN",
        403,
      )

    // Vérification des données par le model
    const Model = await ModelsPath(findPatch.targetPath);

    const findTargetMedia = await Model.findOne({ id: findPatch.target?.id });
    if (!findTargetMedia)
      throw new APIError(
        "Erreur problématique le media cible n'existe plus ?",
        "NOT_FOUND",
        404,
      );

    await findPatch.updateOne({
      status: "REJECTED",
      moderatorNote: props.moderatorNote,
      oldValues: findTargetMedia.toJSON()
    })

    await findTargetMedia
      .deleteOne()
      .session(this.session);

    switch (findPatch.targetPath) {
      case "Anime":
        if (findTargetMedia.cover?.id)
          await ImageManager.deleteImageFileIfExist(findTargetMedia.cover?.id, findPatch.targetPath);
        if (findTargetMedia.banner?.id)
          await ImageManager.deleteImageFileIfExist(findTargetMedia.banner?.id, findPatch.targetPath);
        break;
    }

    const action = "DENY_" + findPatch.type + "_" + findPatch.targetPath.toUpperCase() as keyof typeof ActivityActionObj

    await this.activityManager
      .CreateActivity(
        "MODERATION",
        action,
        {
          author: { id: this.user.id },
          target: { id: findPatch.id },
          targetPath: "Patch",
        },
      );

    // DiscordWebhook.error(`${PatchTypeObj[findPatch.type]} | ${findPatch.targetPath} (${findPatch.target?.id})`, `Modification ID: ${findPatch.target?.id} - refus par un modérateur`, `Modérateur: ${this.user?.username} (${this.user?.id})`);

    const embed = new MessageBuilder()
      .setTitle(`${PatchTypeObj[findPatch.type]} | ${TargetPathObj[findPatch.targetPath]} (${findPatch.target?.id})`)
      .setColor(0xff0000)
      .addField("Modérateur qui refuse les modifications", `${this.user?.username} (${this.user?.id})`)
      .addField("Auteur original", `${findPatch.author?.data?.username} (${findPatch.author?.data?.id})`)
      .setDescription(`Un modérateur a refusé une **${PatchTypeObj[findPatch.type]}** pour un(e) **${TargetPathObj[findPatch.targetPath]}**.`)
      .setFooter('Actunime API | Logs')
      .setTimestamp();

    if (props.moderatorNote)
      embed.addField("Note modérateur", props.moderatorNote)

    await DiscordWebhook.send(embed);
  }

  public async deletePatch(props: IDenyChangesToPatch_ZOD) {
    if (!this.user)
      throw new APIError("Utilisateur non défini obligatoire pour une modification", "NOT_FOUND", 400);

    const findPatch = await PatchModel
      .findOne({ id: props.id })
      .populate("author.data")
      .session(this.session);

    if (!findPatch)
      throw new APIError(
        "Aucun patch correspondant à cet identifiant",
        "NOT_FOUND",
        404,
      );

    if (findPatch.ref?.id)
      throw new APIError(
        "Vous pouvez supprimer que les modifications sans références",
        "FORBIDDEN",
        403,
      );

    if (!findPatch.type.endsWith("REQUEST"))
      throw new APIError(
        "Cette modification ne peut pas être supprimée car elle n'est pas de type demande",
        "FORBIDDEN",
        403,
      )

    if (findPatch.status !== "PENDING")
      throw new APIError(
        "Cette modification ne peut pas être supprimée car elle n'est pas en attente",
        "FORBIDDEN",
        403,
      )

    // Vérification des données par le model
    const Model = await ModelsPath(findPatch.targetPath);

    const findTargetMedia = await Model.findOne({ id: findPatch.target?.id });
    if (findTargetMedia) {
      if (findTargetMedia.isVerified) {
        throw new APIError(
          "Un média verifié est lié a cet modification, vous ne pouvez pas le supprimer",
          "FORBIDDEN",
          403
        )
      } else {
        await findTargetMedia
          .deleteOne()
        switch (findPatch.targetPath) {
          case "Anime":
            if (findTargetMedia.cover?.id)
              await ImageManager.deleteImageFileIfExist(findTargetMedia.cover?.id, findPatch.targetPath);
            if (findTargetMedia.banner?.id)
              await ImageManager.deleteImageFileIfExist(findTargetMedia.banner?.id, findPatch.targetPath);
            break;
        }
      }
    }

    await PatchModel.find({ ref: { id: findPatch.id } }).then(async (result) => {
      return result.forEach(async (patch) => {
        await patch.deleteOne();
      })
    })

    await findPatch.deleteOne();

    const action = "DELETE_" + findPatch.type + "_" + findPatch.targetPath.toUpperCase() as keyof typeof ActivityActionObj

    await this.activityManager
      .CreateActivity(
        "MODERATION",
        action,
        {
          author: { id: this.user.id },
          target: { id: findPatch.id },
          targetPath: "Patch",
        },
      );

    // DiscordWebhook.error(`${PatchTypeObj[findPatch.type]} | ${findPatch.targetPath} (${findPatch.target?.id})`, `Modification ID: ${findPatch.target?.id} - refus (par suppression) par un modérateur`, `Modérateur: ${this.user?.username} (${this.user?.id})`);

    const embed = new MessageBuilder()
      .setTitle(`${PatchTypeObj[findPatch.type]} | ${TargetPathObj[findPatch.targetPath]} (${findPatch.target?.id})`)
      .setColor(0xff0000)
      .addField("Modérateur qui refuse (par suppression) les modifications", `${this.user?.username} (${this.user?.id})`)
      .addField("Auteur original", `${findPatch.author?.data?.username} (${findPatch.author?.data?.id})`)
      .setDescription(`Un modérateur a refusé (par suppression) une **${PatchTypeObj[findPatch.type]}** pour un(e) **${TargetPathObj[findPatch.targetPath]}**.`)
      .setFooter('Actunime API | Logs')
      .setTimestamp();

    if (props.moderatorNote)
      embed.addField("Note modérateur", props.moderatorNote)

    await DiscordWebhook.send(embed);
  }
}

export { PatchManager };
