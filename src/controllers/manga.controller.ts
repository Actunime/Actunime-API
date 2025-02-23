import { MangaModel } from "@actunime/mongoose-models";
import { ClientSession, Document, Schema } from "mongoose";
import { APIError } from "../_lib/Error";
import { IManga, IPatchType, IUser } from "@actunime/types";
import { PaginationControllers } from "./pagination.controllers";
import { z } from "zod";
import { MangaPaginationBody, IAdd_Manga_ZOD } from "@actunime/validations";
import { UtilControllers } from "../_utils/_controllers";
import { PatchControllers } from "./patch";
import DeepDiff from 'deep-diff';

type IMangaDoc = (Document<unknown, unknown, IManga> & IManga & Required<{
    _id: Schema.Types.ObjectId;
}> & {
    __v: number;
}) | null

interface IMangaResponse extends IManga {
    parsedManga: () => Partial<IManga> | null
}

type IMangaControlled = IMangaDoc & IMangaResponse

interface MangaPatchParams {
    mediaId?: string;
    // refId: string,
    description?: string,
    type: IPatchType
}

class MangaController extends UtilControllers.withUser {
    private session: ClientSession | null = null;

    constructor(session: ClientSession | null, user?: IUser) {
        super(user);
        this.session = session;
    }

    parse(Manga: Partial<IManga>) {
        delete Manga._id;

        return Manga;
    }

    warpper(data: IMangaDoc): IMangaControlled {
        if (!data)
            throw new APIError("Aucun utilisateur n'a été trouvé", "NOT_FOUND");

        const res = data as IMangaControlled;
        res.parsedManga = this.parse.bind(this, data)

        return res;
    }

    async getById(id: string) {
        const res = await MangaModel.findOne({ id }).cache("60m");
        return this.warpper(res);
    }

    async filter(pageFilter: z.infer<typeof MangaPaginationBody>, options?: { onlyVerified: boolean }) {
        const pagination = new PaginationControllers(MangaModel);

        pagination.useFilter(pageFilter, options?.onlyVerified);

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
        return res;
    }


    async create_relation(manga: IAdd_Manga_ZOD): Promise<IManga['parent']> {
        const res = await this.getById(manga.id!);
        return { id: res.id, parentLabel: manga.parentLabel };
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