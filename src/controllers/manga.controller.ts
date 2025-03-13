import { MangaModel } from "@actunime/mongoose-models";
import { ClientSession, Document, Schema } from "mongoose";
import { APIError } from "../_lib/Error";
import { IManga, IPatchType, IUser, PatchTypeObj } from "@actunime/types";
import { PaginationControllers } from "./pagination.controllers";
import { z } from "zod";
import { MangaPaginationBody, IAdd_Manga_ZOD } from "@actunime/validations";
import { UtilControllers } from "../_utils/_controllers";
import { PatchControllers } from "./patch";
import DeepDiff from 'deep-diff';
import { MessageBuilder } from "discord-webhook-node";
import { APIDiscordWebhook } from "../_utils";
import LogSession from "../_utils/_logSession";

type IMangaDoc = (Document<unknown, unknown, IManga> & IManga & Required<{
    _id: Schema.Types.ObjectId;
}> & {
    __v: number;
}) | null;

interface IMangaResponse extends IManga {
    parsedManga: () => Partial<IManga> | null
}

type IMangaControlled = IMangaDoc & IMangaResponse

interface MangaPatchParams {
    mediaId?: string;
    pathId?: string,
    // refId: string,
    description?: string,
    type: IPatchType
}

class MangaController extends UtilControllers.withUser {
    private session: ClientSession | null = null;
    private log?: LogSession;

    constructor(session: ClientSession | null, options?: { log?: LogSession, user?: IUser }) {
        super(options?.user);
        this.session = session;
        this.log = options?.log;
    }


    parse(Manga: Partial<IManga>) {
        delete Manga._id;

        return Manga;
    }

    warpper(data: IMangaDoc): IMangaControlled {
        if (!data)
            throw new APIError("Aucun manga n'a été trouvé", "NOT_FOUND");

        const res = data as IMangaControlled;
        res.parsedManga = this.parse.bind(this, data)

        return res;
    }

    async getById(id: string) {
        const res = await MangaModel.findOne({ id }).cache("60m");
        return this.warpper(res);
    }

    async filter(pageFilter: z.infer<typeof MangaPaginationBody>) {
        const pagination = new PaginationControllers(MangaModel);

        pagination.useFilter(pageFilter);

        const res = await pagination.getResults();

        return res;
    }

    // Création d'un manga
    private async create(data: Partial<IManga>) {
        this.needUser(this.user);

        const res = new MangaModel(data);
        await res.save({ session: this.session });
        return this.warpper(res);
    }

    // Création avec patch (public)
    public async create_patch(data: Partial<IManga>, params: MangaPatchParams) {
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
            this.needRoles(["MANGA_MODERATOR", "MANGA_MODERATOR"]);

        await patch.create({
            id: params.pathId,
            type: params.type,
            author: { id: this.user.id },
            target: { id: res.id },
            targetPath: "Manga",
            status: isModerator ? "ACCEPTED" : "PENDING",
            original: res.toJSON(),
            changes,
            description: params.description,
            // ref: params.refId ? { id: params.refId } : undefined, // logique une modif d'manga ne peut pas avoir de ref
            moderator: isModerator ? { id: this.user.id } : undefined
        });


        this.log?.add("Mise a jour | Manga", [
            { name: "ID", content: res.id },
            { name: "Nom", content: res.title.default },
            { name: "MajID", content: params.pathId },
            { name: "Description", content: params.description },
            { name: "Type", content: PatchTypeObj[params.type] },
            { name: "Status", content: isModerator ? "Accepté" : "En attente" },
        ])

        return res;
    }


    async create_relation<T>(manga: Partial<IAdd_Manga_ZOD>): Promise<T> {
        const res = await this.getById(manga.id!);
        return { id: res.id, parentLabel: manga.parentLabel } as T;
    }

    private async delete(id: string) {
        const res = await MangaModel.findOneAndDelete({ id }, { session: this.session });
        return this.warpper(res);
    }

    private async update(id: string, data: Partial<IManga>) {
        const res = await MangaModel.findOneAndUpdate({ id }, data, { session: this.session });
        return this.warpper(res);
    }
}

export { MangaController };