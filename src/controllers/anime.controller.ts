import { AnimeModel } from "@actunime/mongoose-models";
import { ClientSession, Document, Schema } from "mongoose";
import { APIError } from "../_lib/Error";
import { IAnime, IPatchType, IUser, PatchTypeObj } from "@actunime/types";
import { PaginationControllers } from "./pagination.controllers";
import { z } from "zod";
import { AnimePaginationBody, IAdd_Anime_ZOD, ICreate_Anime_ZOD } from "@actunime/validations";
import { UtilControllers } from "../_utils/_controllers";
import { PatchControllers } from "./patch";
import DeepDiff from 'deep-diff';
import { GroupeController } from "./groupe.controller";
import { ImageController } from "./image.controller";
import { MangaController } from "./manga.controller";
import { CompanyController } from "./company.controller";
import { PersonController } from "./person.controler";
import { CharacterController } from "./character.controller";
import { TrackController } from "./track.controller";
import { MessageBuilder } from "discord-webhook-node";
import { APIDiscordWebhook } from "../_utils";
import LogSession from "../_utils/_logSession";

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
    private log?: LogSession;

    constructor(session: ClientSession | null, options?: { log?: LogSession, user?: IUser }) {
        super(options?.user);
        this.session = session;
        this.log = options?.log;
    }

    parse(Anime: Partial<IAnime>) {
        delete Anime._id;

        return Anime;
    }

    warpper(data: IAnimeDoc): IAnimeControlled {
        if (!data)
            throw new APIError("Aucun anime n'a été trouvé", "NOT_FOUND");

        const res = data as IAnimeControlled;
        res.parsedAnime = this.parse.bind(this, data)

        return res;
    }

    async getById(id: string) {
        const res = await AnimeModel.findOne({ id }).cache("60m");
        return this.warpper(res);
    }

    async filter(pageFilter: z.infer<typeof AnimePaginationBody>) {
        const pagination = new PaginationControllers(AnimeModel);

        pagination.useFilter(pageFilter);

        const res = await pagination.getResults();

        return res;
    }

    async build(input: ICreate_Anime_ZOD, { refId, description }: { refId: string, description?: string }) {
        const { groupe, parent, cover, banner, manga, companys, staffs, characters, tracks, ...rawAnime } = input;
        const anime: Partial<IAnime> = { ...rawAnime };
        const user = this.user;
        this.needUser(user);
        const session = this.session;

        if (groupe)
            anime.groupe = await new GroupeController(session, { log: this.log, user })
                .create_relation(groupe, { refId, description, type: "MODERATOR_CREATE" });

        if (parent && parent.id)
            anime.parent = await this.create_relation(parent);

        if (cover || banner) {
            const imageController = new ImageController(session, { log: this.log, user });

            if (cover)
                anime.cover = await imageController.create_relation(cover,
                    { refId, description, type: "MODERATOR_CREATE", targetPath: "Anime" }
                );

            if (banner)
                anime.banner = await imageController.create_relation(banner,
                    { refId, description, type: "MODERATOR_CREATE", targetPath: "Anime" }
                );
        }

        if (manga && manga.id)
            anime.manga = await new MangaController(session, { log: this.log, user }).create_relation(manga);

        if (companys && companys.length > 0) {
            const companyController = new CompanyController(session, { log: this.log, user });
            anime.companys = await Promise.all(companys.map((company) => {
                return companyController.create_relation(company,
                    { refId, description, type: "MODERATOR_CREATE" }
                );
            }));
        }

        if (staffs && staffs.length > 0) {
            const personController = new PersonController(session, { log: this.log, user });
            anime.staffs = await Promise.all(staffs.map((person) => {
                return personController.create_relation(person,
                    { refId, description, type: "MODERATOR_CREATE" }
                );
            }));
        }

        if (characters && characters.length > 0) {
            const characterController = new CharacterController(session, { log: this.log, user });
            anime.characters = await Promise.all(characters.map((character) => {
                return characterController.create_relation(character,
                    { refId, description, type: "MODERATOR_CREATE" }
                );
            }));
        }

        if (tracks && tracks.length > 0) {
            const trackController = new TrackController(session, { log: this.log, user });
            anime.tracks = await Promise.all(tracks.map((track) => {
                return trackController.create_relation(track,
                    { refId, description, type: "MODERATOR_CREATE" }
                );
            }));
        }

        return anime;
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

        const embed = new MessageBuilder()
            .setTitle("Mise a jour | Anime")
            .setDescription(`Une mise a jour sur l'anime ${res.title.default}`)
            .addField("Type", PatchTypeObj[params.type], true)
            .addField("Status", isModerator ? "Accepté" : "En attente", true)

        if (params.description)
            embed.addField("Description", params.description, true)

        if (isModerator)
            embed.addField("Moderateur", `${this.user.displayName} (${this.user.id})`, true)
        else embed.addField("Auteur", `${this.user.displayName} (${this.user.id})`, true)

        this.log?.add("Mise a jour | Anime", [
            { name: "Nom", content: res.title.default },
            { name: "ID", content: res.id },
            { name: "MajID", content: params.pathId },
            { name: "Description", content: params.description },
            { name: "Type", content: PatchTypeObj[params.type] },
            { name: "Status", content: isModerator ? "Accepté" : "En attente" },
        ])

        return res;
    }


    async create_relation(anime: Partial<IAdd_Anime_ZOD>): Promise<IAnime['parent']> {
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