import { ClientSession, Document, Schema } from "mongoose";
import { APIError } from "../_lib/Error";
import { IGroupe, ITargetPath, IUser } from "@actunime/types";
import { PaginationControllers } from "./pagination.controllers";
import { z } from "zod";
import { GroupePaginationBody, IGroupeBody, IMediaDeleteBody } from "@actunime/validations";
import { UtilControllers } from "../_utils/_controllers";
import LogSession from "../_utils/_logSession";
import { DevLog } from "../_lib/logger";
import { genPublicID } from "@actunime/utils";
import DeepDiff from 'deep-diff';
import { PatchController } from "./patch.controllers";
import { GroupeModel } from "../_lib/models";

type IGroupeDoc = (Document<unknown, unknown, IGroupe> & IGroupe & Required<{
    _id: Schema.Types.ObjectId;
}> & {
    __v: number;
}) | null;

interface IGroupeResponse extends IGroupe {
    parsedGroupe: () => Partial<IGroupe> | null
}

type IGroupeControlled = IGroupeDoc & IGroupeResponse

interface GroupeParams { refId?: string, description?: string }

class GroupeController extends UtilControllers.withUser {
    private targetPath: ITargetPath = "Groupe";
    private patchController: PatchController;

    constructor(session?: ClientSession | null, options?: { log?: LogSession, user?: IUser }) {
        super({ session, ...options });
        this.patchController = new PatchController(session, options);
    }

    parse(Groupe: Partial<IGroupe>) {
        // delete Groupe._id;

        return Groupe;
    }

    warpper(data: IGroupeDoc): IGroupeControlled {
        if (!data)
            throw new APIError("Aucun groupe n'a été trouvé", "NOT_FOUND");

        const res = data as IGroupeControlled;
        res.parsedGroupe = this.parse.bind(this, data)

        return res;
    }

    async getById(id: string) {
        DevLog(`Récupération du groupe ID: ${id}`, "debug");
        const promise = GroupeModel.findOne({ id });
        if (this.session) promise.session(this.session); else promise.cache("60m");
        const res = await promise;
        DevLog(`Groupe ${res ? "trouvée" : "non trouvée"}, ID Groupe: ${id}`, "debug");
        return this.warpper(res);
    }

    async filter(pageFilter: z.infer<typeof GroupePaginationBody>) {
        DevLog("Filtrage des groupes...", "debug");
        const pagination = new PaginationControllers(GroupeModel);

        pagination.useFilter(pageFilter);

        const res = await pagination.getResults();

        DevLog(`Groupes trouvées: ${res.resultsCount}`, "debug");
        return res;
    }

    async build(input: IGroupeBody) {
        const groupe: Partial<IGroupe> = input;
        DevLog(`Build Groupe...`)
        return new GroupeModel(groupe);
    }

    public async create(data: IGroupeBody, params: GroupeParams) {
        DevLog(`Création d'un groupe...`);
        this.needUser(this.user);
        const patchID = genPublicID(8);
        const res = await this.build(data);
        res.isVerified = true;

        await this.patchController.create({
            id: patchID,
            ...params.refId && { ref: { id: params.refId } },
            type: "CREATE",
            author: { id: this.user.id },
            target: { id: res.id },
            targetPath: this.targetPath,
            original: res.toJSON(),
            status: "ACCEPTED",
            description: params.description,
            moderator: { id: this.user.id }
        });

        await res.save({ session: this.session });

        this.log?.add("Création d'un groupe", [
            { name: "Nom", content: res.name },
            { name: "ID", content: res.id },
            { name: "MajID", content: patchID },
            { name: "Description", content: params.description },
            { name: "Modérateur", content: `${this.user.username} (${this.user.id})` }
        ])

        DevLog(`Groupe créé, ID Groupe: ${res.id}`, "debug");
        return this.warpper(res);
    }


    public async update(id: string, data: IGroupeBody, params: GroupeParams) {
        DevLog(`Mise à jour d'un groupe...`);
        this.needUser(this.user);
        const media = await this.getById(id);
        // Mettre un warning coté client pour prévenir au cas ou il y a des mise a jour en attente de validation avant de faire une modif
        const refId = genPublicID(8);
        const res = await this.build(data);
        res.id = media.id;
        res._id = media._id;

        await this.patchController.create({
            id: refId,
            type: "UPDATE",
            author: { id: this.user.id },
            target: { id: res.id },
            targetPath: this.targetPath,
            original: media.toJSON(),
            changes: DeepDiff.diff(media, res, {
                prefilter: (_, key) => (["__v", "_id", "id"].includes(key) ? false : true)
            }),
            status: "ACCEPTED",
            description: params.description,
            moderator: { id: this.user.id }
        });

        await media.updateOne(res).session(this.session);

        this.log?.add("Modification d'un groupe", [
            { name: "Nom", content: res.name },
            { name: "ID", content: res.id },
            { name: "MajID", content: refId },
            { name: "Description", content: params.description },
            { name: "Modérateur", content: `${this.user.username} (${this.user.id})` }
        ])

        DevLog(`Groupe mis à jour, ID Groupe: ${res.id}`, "debug");
        return this.warpper(res);
    }

    public async delete(id: string, params: IMediaDeleteBody) {
        DevLog(`Suppression d'un groupe...`);
        this.needUser(this.user);
        const media = await this.getById(id);
        const deleted = await media.deleteOne().session(this.session);
        const refId = genPublicID(8);
        if (deleted.deletedCount > 0) {
            await this.patchController.create({
                id: refId,
                type: "DELETE",
                author: { id: this.user.id },
                target: { id: media.id },
                targetPath: this.targetPath,
                original: media.toJSON(),
                status: "ACCEPTED",
                reason: params.reason,
                moderator: { id: this.user.id }
            });

            this.log?.add("Suppresion d'un groupe", [
                { name: "Nom", content: media.name },
                { name: "ID", content: media.id },
                { name: "Raison", content: params.reason },
                { name: "Modérateur", content: `${this.user.username} (${this.user.id})` }
            ])

            DevLog(`Groupe supprimé, ID Groupe: ${media.id}, ID Maj: ${refId}`, "debug");
            return true;
        }

        DevLog(`Groupe non supprimé, ID Groupe: ${media.id}`, "debug");
        return false;
    }

    public async verify(id: string) {
        DevLog("Verification de groupe...", "debug");
        this.needUser(this.user);
        const media = await this.getById(id);
        media.isVerified = true;
        await media.save({ session: this.session });
        DevLog(`Groupe verifié, ID Groupe: ${media.id}`, "debug");
        return this.warpper(media);
    }

    public async unverify(id: string) {
        DevLog("Verification de groupe...", "debug");
        this.needUser(this.user);
        const media = await this.getById(id);
        media.isVerified = false;
        await media.save({ session: this.session });
        DevLog(`Groupe non verifié, ID Groupe: ${media.id}`, "debug");
        return this.warpper(media);
    }

    public async create_request(data: IGroupeBody, params: GroupeParams) {
        DevLog("Demande de création de groupe...", "debug");
        this.needUser(this.user);
        const refId = genPublicID(8);
        const res = await this.build(data);
        res.isVerified = false;

        await this.patchController.create({
            id: refId,
            type: "CREATE",
            author: { id: this.user.id },
            target: { id: res.id },
            targetPath: "Groupe",
            original: res.toJSON(),
            status: "PENDING",
            description: params.description
        });

        await res.save({ session: this.session });

        this.log?.add("Demande de création d'un groupe", [
            { name: "Nom", content: res.name },
            { name: "ID", content: res.id },
            { name: "MajID", content: refId },
            { name: "Description", content: params.description },
            { name: "Modérateur", content: `${this.user.username} (${this.user.id})` }
        ])

        DevLog(`Groupe crée, Demande crée... ID Groupe: ${res.id}, ID Demande: ${refId}`, "debug");
        return this.warpper(res);
    }

    public async update_request(id: string, data: IGroupeBody, params: GroupeParams) {
        DevLog("Demande de modification de groupe...", "debug");
        this.needUser(this.user);
        const media = await this.getById(id);
        // Mettre un warning coté client pour prévenir au cas ou il y a des mise a jour en attente de validation avant de faire une modif
        const refId = genPublicID(8);
        const res = await this.build(data);
        res.id = media.id;
        res._id = media._id;

        await this.patchController.create({
            id: refId,
            type: "UPDATE",
            author: { id: this.user.id },
            target: { id: res.id },
            targetPath: "Groupe",
            original: media.toJSON(),
            changes: DeepDiff.diff(media, res, {
                prefilter: (_, key) => (["__v", "_id", "id"].includes(key) ? false : true)
            }),
            status: "PENDING",
            description: params.description
        });


        this.log?.add("Demande de modification d'un groupe", [
            { name: "Nom", content: res.name },
            { name: "ID", content: res.id },
            { name: "MajID", content: refId },
            { name: "Description", content: params.description },
            { name: "Modérateur", content: `${this.user.username} (${this.user.id})` }
        ])

        DevLog(`Groupe modifié, Demande crée... ID Groupe: ${res.id}, ID Demande: ${refId}`, "debug");
        return this.warpper(res);
    }

}

export { GroupeController };