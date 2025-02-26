import { AnimeModel } from "@actunime/mongoose-models";
import { ClientSession, Document, Schema } from "mongoose";
import { APIError } from "../_lib/Error";
import { IAnime, IPatchType, IUser } from "@actunime/types";
import { PaginationControllers } from "./pagination.controllers";
import { z } from "zod";
import { AnimePaginationBody, IAdd_Anime_ZOD } from "@actunime/validations";
import { UtilControllers } from "../_utils/_controllers";
import { PatchControllers } from "./patch";
import DeepDiff from 'deep-diff';

type IAnimeDoc = (Document<unknown, unknown, IAnime> & IAnime & Required<{
    _id: Schema.Types.ObjectId;
}> & {
    __v: number;
}) | null;

interface IAnimeResponse extends IAnime {
    parsedAnime: () => Partial<IAnime> | null
}

type IAnimeControlled = IAnimeDoc & IAnimeResponse

interface AnimePatchParams {
    mediaId?: string;
    pathId?: string,
    // refId: string,
    description?: string,
    type: IPatchType
}

class AnimeController extends UtilControllers.withUser {
    private session: ClientSession | null = null;

    constructor(session: ClientSession | null, user?: IUser) {
        super(user);
        this.session = session;
    }

    parse(Anime: Partial<IAnime>) {
        delete Anime._id;

        return Anime;
    }

    warpper(data: IAnimeDoc): IAnimeControlled {
        if (!data)
            throw new APIError("Aucun utilisateur n'a été trouvé", "NOT_FOUND");

        const res = data as IAnimeControlled;
        res.parsedAnime = this.parse.bind(this, data)

        return res;
    }

    async getById(id: string) {
        const res = await AnimeModel.findOne({ id }).cache("60m");
        return this.warpper(res);
    }

    async filter(pageFilter: z.infer<typeof AnimePaginationBody>, options?: { onlyVerified: boolean }) {
        const pagination = new PaginationControllers(AnimeModel);

        pagination.useFilter(pageFilter, options?.onlyVerified);

        const res = await pagination.getResults();

        return res;
    }

    // Création d'un anime
    private async create(data: Partial<IAnime>) {
        this.needUser(this.user);

        const res = new AnimeModel(data);
        await res.save({ session: this.session });
        return this.warpper(res);
    }

    // Création avec patch (public)
    public async create_patch(data: Partial<IAnime>, params: AnimePatchParams) {
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
            id: params.pathId,
            type: params.type,
            author: { id: this.user.id },
            target: { id: res.id },
            targetPath: "Anime",
            status: isModerator ? "ACCEPTED" : "PENDING",
            original: res.toJSON(),
            changes,
            description: params.description,
            // ref: params.refId ? { id: params.refId } : undefined, // logique une modif d'anime ne peut pas avoir de ref
            moderator: isModerator ? { id: this.user.id } : undefined
        });
        return res;
    }


    async create_relation(anime: IAdd_Anime_ZOD): Promise<IAnime['parent']> {
        const res = await this.getById(anime.id!);
        return { id: res.id, parentLabel: anime.parentLabel };
    }

    private async delete(id: string) {
        const res = await AnimeModel.findOneAndDelete({ id }, { session: this.session });
        return this.warpper(res);
    }

    private async update(id: string, data: Partial<IAnime>) {
        const res = await AnimeModel.findOneAndUpdate({ id }, data, { session: this.session });
        return this.warpper(res);
    }
}

export { AnimeController };