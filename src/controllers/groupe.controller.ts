import { GroupeModel } from "@actunime/mongoose-models";
import { ClientSession, Document, Schema } from "mongoose";
import { APIError } from "../_lib/Error";
import { IGroupe, IPatchType, IUser, PatchTypeObj } from "@actunime/types";
import { PaginationControllers } from "./pagination.controllers";
import { z } from "zod";
import { GroupePaginationBody, IAdd_Groupe_ZOD } from "@actunime/validations";
import { UtilControllers } from "../_utils/_controllers";
import { PatchControllers } from "./patch";
import DeepDiff from 'deep-diff';
import { MessageBuilder } from "discord-webhook-node";
import { APIDiscordWebhook } from "../_utils";
import LogSession from "../_utils/_logSession";

type IGroupeDoc = (Document<unknown, unknown, IGroupe> & IGroupe & Required<{
    _id: Schema.Types.ObjectId;
}> & {
    __v: number;
}) | null;

interface IGroupeResponse extends IGroupe {
    parsedGroupe: () => Partial<IGroupe> | null
}

type IGroupeControlled = IGroupeDoc & IGroupeResponse

interface GroupePatchParams {
    mediaId?: string;
    refId: string,
    description?: string,
    type: IPatchType
}

class GroupeController extends UtilControllers.withUser {
    private session: ClientSession | null = null;
    private log?: LogSession;

    constructor(session: ClientSession | null, options?: { log?: LogSession, user?: IUser }) {
        super(options?.user);
        this.session = session;
        this.log = options?.log;
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

    // Création d'un groupe
    private async create(data: Partial<IGroupe>) {
        this.needUser(this.user);

        const res = new GroupeModel(data);
        await res.save({ session: this.session });

        return this.warpper(res);
    }

    // Création avec patch (public)
    public async create_patch(data: Partial<IGroupe>, params: GroupePatchParams) {
        this.needUser(this.user);
        const res = await this.create(data);
        const patch = new PatchControllers(this.session, this.user);
        let changes;

        if (params.type.endsWith("UPDATE")) {
            if (!params.mediaId)
                throw new APIError("Le mediaId est obligatoire", "BAD_ENTRY");

            changes = DeepDiff.diff(res, data, {
                prefilter: (path, key) => {
                    return ["__v", "_id", "id"].includes(key) ? false : true
                }
            });
        }

        const isModerator = params.type.startsWith("MODERATOR") ? true : false;

        if (isModerator)
            this.needRoles(["ANIME_MODERATOR", "MANGA_MODERATOR"]);

        await patch.create({
            type: params.type,
            author: { id: this.user.id },
            target: { id: res.id },
            targetPath: "Groupe",
            status: isModerator ? "ACCEPTED" : "PENDING",
            original: res.toJSON(),
            changes,
            description: params.description,
            ref: params.refId ? { id: params.refId } : undefined,
            moderator: isModerator ? { id: this.user.id } : undefined
        });

        this.log?.add("Mise a jour | Groupe", [
            { name: "ID", content: res.id },
            { name: "Nom", content: res.name },
            { name: "RefID", content: params.refId },
            { name: "Description", content: params.description },
            { name: "Type", content: PatchTypeObj[params.type] },
            { name: "Status", content: isModerator ? "Accepté" : "En attente" },
        ])

        return res;
    }


    async create_relation(groupe: IAdd_Groupe_ZOD, params: GroupePatchParams) {
        if (!groupe.id && !groupe.newGroupe)
            throw new APIError("Le groupe est obligatoire", "BAD_ENTRY");
        if (groupe.id && groupe.newGroupe)
            throw new APIError("Faites un choix... vous ne pouvez pas assigner un nouveau groupe et un existant", "BAD_ENTRY");

        if (groupe.newGroupe) {
            const res = await this.create_patch(groupe.newGroupe, params);
            return { id: res.id };
        }

        const res = await this.getById(groupe.id!);
        return { id: res.id };
    }

    private async delete(id: string) {
        const res = await GroupeModel.findOneAndDelete({ id }, { session: this.session });
        return this.warpper(res);
    }

    private async update(id: string, data: Partial<IGroupe>) {
        const res = await GroupeModel.findOneAndUpdate({ id }, data, { session: this.session });
        return this.warpper(res);
    }
}

export { GroupeController };