import { AnimeModel } from "@actunime/mongoose-models";
import { ClientSession, Document, Schema } from "mongoose";
import { APIError } from "../_lib/Error";
import { IAnime, ITargetPath, IUser } from "@actunime/types";
import { PaginationControllers } from "./pagination.controllers";
import { z } from "zod";
import { AnimePaginationBody, ICreate_Anime_ZOD, IMediaDeleteBody } from "@actunime/validations";
import { UtilControllers } from "../_utils/_controllers";
import { PatchController } from "./patch.controllers";
import DeepDiff from 'deep-diff';
import { GroupeController } from "./groupe.controller";
import { ImageController } from "./image.controller";
import { MangaController } from "./manga.controller";
import { CompanyController } from "./company.controller";
import { PersonController } from "./person.controler";
import { CharacterController } from "./character.controller";
import { TrackController } from "./track.controller";
import LogSession from "../_utils/_logSession";
import { genPublicID } from "@actunime/utils";

type IAnimeDoc = (Document<unknown, unknown, IAnime> & IAnime & Required<{
    _id: Schema.Types.ObjectId;
}> & {
    __v: number;
}) | null;

interface IAnimeResponse extends IAnime {
    parsedAnime: () => Partial<IAnime> | null
    hasPendingPatch: () => Promise<boolean>
}

type IAnimeControlled = IAnimeDoc & IAnimeResponse

interface AnimeParams {
    description?: string,
}

class AnimeController extends UtilControllers.withUser {
    private session: ClientSession | null = null;
    private log?: LogSession;
    private patchController: PatchController;
    private targetPath: ITargetPath = "Anime";

    constructor(session: ClientSession | null, options?: { log?: LogSession, user?: IUser }) {
        super(options?.user);
        this.session = session;
        this.log = options?.log;
        this.patchController = new PatchController(this.session, { log: this.log, user: options?.user });
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
        res.hasPendingPatch = this.hasPendingPatch.bind(this, data.id);

        return res;
    }

    async getById(id: string) {
        const res = await AnimeModel.findOne({ id }).cache("60m");
        return this.warpper(res);
    }

    async filter(pageFilter?: z.infer<typeof AnimePaginationBody>) {
        const pagination = new PaginationControllers(AnimeModel);

        pagination.useFilter(pageFilter);

        const res = await pagination.getResults();

        return res;
    }

    async build(input: ICreate_Anime_ZOD, params: { refId: string, isRequest: boolean, animeId?: string }) {
        const { groupe, parent, cover, banner, manga, companys, staffs, characters, tracks, ...rawAnime } = input;
        const anime: Partial<IAnime> & { id: string } = {
            ...rawAnime,
            id: params.animeId || genPublicID(8)
        };
        const user = this.user;
        this.needUser(user);
        const session = this.session;
        const { refId, isRequest } = params;

        if (groupe && (groupe.id || groupe.newGroupe)) {
            const groupeController = new GroupeController(session, { log: this.log, user });
            const getGroupe = groupe.id ? await groupeController.getById(groupe.id) :
                isRequest ?
                    await groupeController.create_request(groupe.newGroupe!, { refId }) :
                    await groupeController.create(groupe.newGroupe!, { refId })
            anime.groupe = { id: getGroupe.id };
        }

        if (parent && parent.id) {
            const getParent = await this.getById(parent.id);
            anime.parent = { id: getParent.id };
        }

        if (cover || banner) {
            const imageController = new ImageController(session, { log: this.log, user });

            if (cover && (cover.id || cover.newImage)) {
                const getImage = cover.id ? await imageController.getById(cover.id) :
                    isRequest ?
                        await imageController.create_request(cover.newImage!, { refId, target: { id: anime.id }, targetPath: this.targetPath }) :
                        await imageController.create(cover.newImage!, { refId, target: { id: anime.id }, targetPath: this.targetPath })
                anime.cover = { id: getImage.id };
            }

            if (banner && (banner.id || banner.newImage)) {
                const getImage = banner.id ? await imageController.getById(banner.id) :
                    isRequest ?
                        await imageController.create_request(banner.newImage!, { refId, target: { id: anime.id }, targetPath: this.targetPath }) :
                        await imageController.create(banner.newImage!, { refId, target: { id: anime.id }, targetPath: this.targetPath })
                anime.banner = { id: getImage.id };
            }
        }

        if (manga && manga.id) {
            const getManga = await new MangaController(session, { log: this.log, user }).getById(manga.id);
            anime.manga = { id: getManga.id };
        }

        if (companys && companys.length > 0) {
            const companyController = new CompanyController(session, { log: this.log, user });
            const getActors = await Promise.all(
                companys.map(async (company) => {
                    if (company && (company.id || company.newCompany)) {
                        const getCompany = company.id ? await companyController.getById(company.id) :
                            isRequest ?
                                await companyController.create_request(company.newCompany!, { refId }) :
                                await companyController.create(company.newCompany!, { refId })
                        return { id: getCompany.id };
                    }
                }))
            anime.companys = getActors.filter((company) => company) as typeof anime.companys;
        }

        if (staffs && staffs.length > 0) {
            const staffController = new PersonController(session, { log: this.log, user });
            const getActors = await Promise.all(
                staffs.map(async (staff) => {
                    if (staff && (staff.id || staff.newPerson)) {
                        const getStaff = staff.id ? await staffController.getById(staff.id) :
                            isRequest ?
                                await staffController.create_request(staff.newPerson!, { refId }) :
                                await staffController.create(staff.newPerson!, { refId })
                        return { id: getStaff.id, role: staff.role };
                    }
                }))
            anime.staffs = getActors.filter((staff) => staff) as typeof anime.staffs;
        }

        if (characters && characters.length > 0) {
            const characterController = new CharacterController(session, { log: this.log, user });
            const getActors = await Promise.all(
                characters.map(async (character) => {
                    if (character && (character.id || character.newCharacter)) {
                        const getCharacter = character.id ? await characterController.getById(character.id) :
                            isRequest ?
                                await characterController.create_request(character.newCharacter!, { refId }) :
                                await characterController.create(character.newCharacter!, { refId })
                        return { id: getCharacter.id, role: character.role };
                    }
                }))
            anime.characters = getActors.filter((character) => character) as typeof anime.characters;
        }

        if (tracks && tracks.length > 0) {
            const trackController = new TrackController(session, { log: this.log, user });
            const getActors = await Promise.all(
                tracks.map(async (track) => {
                    if (track && (track.id || track.newTrack)) {
                        const getTrack = track.id ? await trackController.getById(track.id) :
                            isRequest ?
                                await trackController.create_request(track.newTrack!, { refId }) :
                                await trackController.create(track.newTrack!, { refId })
                        return { id: getTrack.id };
                    }
                }))
            anime.tracks = getActors.filter((track) => track) as typeof anime.tracks;
        }

        return new AnimeModel(anime);
    }

    public async create(data: ICreate_Anime_ZOD, params: AnimeParams) {
        this.needUser(this.user);
        this.needRoles(["ANIME_ADD"], this.user.roles);
        const refId = genPublicID(8);
        const res = await this.build(data, {
            refId,
            isRequest: false
        });
        res.isVerified = true;
        await this.patchController.create({
            id: refId,
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

        this.log?.add("Création d'un anime", [
            { name: "Nom", content: res.title.default },
            { name: "ID", content: res.id },
            { name: "MajID", content: refId },
            { name: "Description", content: params.description },
            { name: "Modérateur", content: `${this.user.username} (${this.user.id})` }
        ])

        return this.warpper(res);
    }

    public async update(id: string, data: ICreate_Anime_ZOD, params: AnimeParams) {
        this.needUser(this.user);
        this.needRoles(["ANIME_PATCH"], this.user.roles);
        const media = await this.getById(id);
        // Mettre un warning coté client pour prévenir au cas ou il y a des mise a jour en attente de validation avant de faire une modif
        const refId = genPublicID(8);
        const res = await this.build(data, { refId, isRequest: false, animeId: media.id });
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

        this.log?.add("Modification d'un anime", [
            { name: "Nom", content: res.title.default },
            { name: "ID", content: res.id },
            { name: "MajID", content: refId },
            { name: "Description", content: params.description },
            { name: "Modérateur", content: `${this.user.username} (${this.user.id})` }
        ])

        return this.warpper(res);
    }

    public async delete(id: string, params: IMediaDeleteBody) {
        this.needUser(this.user);
        this.needRoles(["ANIME_DELETE"], this.user.roles);
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

            this.log?.add("Suppresion d'un anime", [
                { name: "Nom", content: media.title.default },
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
        this.needRoles(["ANIME_VERIFY"], this.user.roles);
        const media = await this.getById(id);
        media.isVerified = true;
        await media.save({ session: this.session });
        return this.warpper(media);
    }

    public async unverify(id: string) {
        this.needUser(this.user);
        this.needRoles(["ANIME_VERIFY"], this.user.roles);
        const media = await this.getById(id);
        media.isVerified = false;
        await media.save({ session: this.session });
        return this.warpper(media);
    }

    public async create_request(data: ICreate_Anime_ZOD, params: AnimeParams) {
        this.needUser(this.user);
        this.needRoles(["ANIME_ADD_REQUEST"], this.user.roles);
        const refId = genPublicID(8);
        const res = await this.build(data, { refId, isRequest: true });
        res.isVerified = false;

        await this.patchController.create({
            id: refId,
            type: "CREATE",
            author: { id: this.user.id },
            target: { id: res.id },
            targetPath: this.targetPath,
            original: res.toJSON(),
            status: "PENDING",
            description: params.description
        });

        await res.save({ session: this.session });

        this.log?.add("Demande de création d'un anime", [
            { name: "Nom", content: res.title.default },
            { name: "ID", content: res.id },
            { name: "MajID", content: refId },
            { name: "Description", content: params.description },
            { name: "Modérateur", content: `${this.user.username} (${this.user.id})` }
        ])

        return this.warpper(res);
    }

    public async update_request(id: string, data: ICreate_Anime_ZOD, params: AnimeParams) {
        this.needUser(this.user);
        this.needRoles(["ANIME_PATCH_REQUEST"], this.user.roles);
        const media = await this.getById(id);
        // Mettre un warning coté client pour prévenir au cas ou il y a des mise a jour en attente de validation avant de faire une modif
        const refId = genPublicID(8);
        const res = await this.build(data, { refId, isRequest: true, animeId: media.id });
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
            status: "PENDING",
            description: params.description
        });

        this.log?.add("Demande de modification d'un anime", [
            { name: "Nom", content: res.title.default },
            { name: "ID", content: res.id },
            { name: "MajID", content: refId },
            { name: "Description", content: params.description },
            { name: "Modérateur", content: `${this.user.username} (${this.user.id})` }
        ])

        return this.warpper(res);
    }

    private async hasPendingPatch(id: string) {
        const res = await this.getById(id);
        const patchs = await this.patchController.fitlerPatchFrom("Anime", res.id, "PENDING");
        return patchs.length > 0;
    }
}

export { AnimeController };