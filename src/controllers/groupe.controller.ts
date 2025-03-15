import { GroupeModel } from "@actunime/mongoose-models";
import { ClientSession, Document, Schema } from "mongoose";
import { APIError } from "../_lib/Error";
import { IGroupe, IPatchType, ITargetPath, IUser } from "@actunime/types";
import { PaginationControllers } from "./pagination.controllers";
import { z } from "zod";
import { GroupePaginationBody, IAdd_Groupe_ZOD, ICreate_Groupe_ZOD, IMediaDeleteBody } from "@actunime/validations";
import { UtilControllers } from "../_utils/_controllers";
import LogSession from "../_utils/_logSession";
import { genPublicID } from "@actunime/utils";
import { PatchController } from "./patch.controllers";
import DeepDiff from 'deep-diff';

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
    private session: ClientSession | null = null;
    private log?: LogSession;
    private patchController: PatchController;
    private targetPath: ITargetPath = "Groupe";

    constructor(session: ClientSession | null, options?: { log?: LogSession, user?: IUser }) {
        super(options?.user);
        this.session = session;
        this.log = options?.log;
        this.patchController = new PatchController(this.session, { log: this.log, user: options?.user });
    }


    parse(Groupe: Partial<IGroupe>) {
        delete Groupe._id;

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
        const res = await GroupeModel.findOne({ id }).cache("60m");
        return this.warpper(res);
    }

    async filter(pageFilter: z.infer<typeof GroupePaginationBody>) {
        const pagination = new PaginationControllers(GroupeModel);

        pagination.useFilter(pageFilter);

        const res = await pagination.getResults();

        return res;
    }

    async build(input: ICreate_Groupe_ZOD) {
        const groupe: Partial<IGroupe> = input;
        return new GroupeModel(groupe);
    }

    public async create(data: ICreate_Groupe_ZOD, params: GroupeParams) {
        this.needUser(this.user);
        this.needRoles(["GROUPE_ADD", "ANIME_ADD", "MANGA_ADD"], this.user.roles, false);
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

        return this.warpper(res);
    }


    public async update(id: string, data: ICreate_Groupe_ZOD, params: GroupeParams) {
        this.needUser(this.user);
        this.needRoles(["GROUPE_PATCH", "ANIME_PATCH", "MANGA_PATCH"], this.user.roles, false);
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

        return this.warpper(res);
    }

    public async delete(id: string, params: IMediaDeleteBody) {
        this.needUser(this.user);
        this.needRoles(["GROUPE_DELETE", "ANIME_DELETE", "MANGA_DELETE"], this.user.roles);
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
            return true;
        }
        return false;
    }

    public async verify(id: string) {
        this.needUser(this.user);
        this.needRoles(["GROUPE_VERIFY", "ANIME_VERIFY", "MANGA_VERIFY"], this.user.roles);
        const media = await this.getById(id);
        media.isVerified = true;
        await media.save({ session: this.session });
        return this.warpper(media);
    }

    public async unverify(id: string) {
        this.needUser(this.user);
        this.needRoles(["GROUPE_VERIFY", "ANIME_VERIFY", "MANGA_VERIFY"], this.user.roles);
        const media = await this.getById(id);
        media.isVerified = false;
        await media.save({ session: this.session });
        return this.warpper(media);
    }

    public async create_request(data: ICreate_Groupe_ZOD, params: GroupeParams) {
        this.needUser(this.user);
        this.needRoles(["GROUPE_ADD_REQUEST"], this.user.roles);
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

        return this.warpper(res);
    }

    public async update_request(id: string, data: ICreate_Groupe_ZOD, params: GroupeParams) {
        this.needUser(this.user);
        this.needRoles(["GROUPE_PATCH_REQUEST"], this.user.roles);
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

        return this.warpper(res);
    }

}

export { GroupeController };