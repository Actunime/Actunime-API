import { MangaModel } from "@actunime/mongoose-models";
import { ClientSession, Document, Schema } from "mongoose";
import { APIError } from "../_lib/Error";
import { IManga, IUser } from "@actunime/types";
import { PaginationControllers } from "./pagination.controllers";
import { z } from "zod";
import { MangaPaginationBody, ICreate_Manga_ZOD, IMediaDeleteBody } from "@actunime/validations";
import { UtilControllers } from "../_utils/_controllers";
import { PatchController } from "./patch.controllers";
import DeepDiff from 'deep-diff';
import { GroupeController } from "./groupe.controller";
import { ImageController } from "./image.controller";
import { CompanyController } from "./company.controller";
import { PersonController } from "./person.controler";
import { CharacterController } from "./character.controller";
import { TrackController } from "./track.controller";
import LogSession from "../_utils/_logSession";
import { genPublicID } from "@actunime/utils";

type IMangaDoc = (Document<unknown, unknown, IManga> & IManga & Required<{
    _id: Schema.Types.ObjectId;
}> & {
    __v: number;
}) | null;

interface IMangaResponse extends IManga {
    parsedManga: () => Partial<IManga> | null
    hasPendingPatch: () => Promise<boolean>
}

type IMangaControlled = IMangaDoc & IMangaResponse

interface MangaParams {
    description?: string,
}

class MangaController extends UtilControllers.withUser {
    private session: ClientSession | null = null;
    private log?: LogSession;
    private patchController: PatchController;

    constructor(session: ClientSession | null, options?: { log?: LogSession, user?: IUser }) {
        super(options?.user);
        this.session = session;
        this.log = options?.log;
        this.patchController = new PatchController(this.session, { log: this.log, user: options?.user });
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
        res.hasPendingPatch = this.hasPendingPatch.bind(this, data.id);

        return res;
    }

    async getById(id: string) {
        const res = await MangaModel.findOne({ id }).cache("60m");
        return this.warpper(res);
    }

    async filter(pageFilter?: z.infer<typeof MangaPaginationBody>) {
        const pagination = new PaginationControllers(MangaModel);

        pagination.useFilter(pageFilter);

        const res = await pagination.getResults();

        return res;
    }

    async build(input: ICreate_Manga_ZOD, params: { refId: string, isRequest: boolean, mangaId?: string }) {
        const { groupe, parent, cover, banner, companys, staffs, characters, tracks, ...rawManga } = input;
        const manga: Partial<IManga> & { id: string } = {
            ...rawManga,
            id: params.mangaId || genPublicID(8)
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
            manga.groupe = { id: getGroupe.id };
        }

        if (parent && parent.id) {
            const getParent = await this.getById(parent.id);
            manga.parent = { id: getParent.id };
        }

        if (cover || banner) {
            const imageController = new ImageController(session, { log: this.log, user });

            if (cover && (cover.id || cover.newImage)) {
                const getImage = cover.id ? await imageController.getById(cover.id) :
                    isRequest ?
                        await imageController.create_request(cover.newImage!, { refId, target: { id: manga.id }, targetPath: "Manga" }) :
                        await imageController.create(cover.newImage!, { refId, target: { id: manga.id }, targetPath: "Manga" })
                manga.cover = { id: getImage.id };
            }

            if (banner && (banner.id || banner.newImage)) {
                const getImage = banner.id ? await imageController.getById(banner.id) :
                    isRequest ?
                        await imageController.create_request(banner.newImage!, { refId, target: { id: manga.id }, targetPath: "Manga" }) :
                        await imageController.create(banner.newImage!, { refId, target: { id: manga.id }, targetPath: "Manga" })
                manga.banner = { id: getImage.id };
            }
        }

        // if (manga && manga.id)
        //     manga.manga = await new MangaController(session, { log: this.log, user }).create_relation(manga);

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
            manga.companys = getActors.filter((company) => company) as typeof manga.companys;
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
            manga.staffs = getActors.filter((staff) => staff) as typeof manga.staffs;
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
            manga.characters = getActors.filter((character) => character) as typeof manga.characters;
        }

        return new MangaModel(manga);
    }

    public async create(data: ICreate_Manga_ZOD, params: MangaParams) {
        this.needUser(this.user);
        this.needRoles(["MANGA_ADD"], this.user.roles);
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
            targetPath: "Manga",
            original: res.toJSON(),
            status: "ACCEPTED",
            description: params.description,
            moderator: { id: this.user.id }
        });

        await res.save({ session: this.session });

        this.log?.add("Création d'un manga", [
            { name: "Nom", content: res.title.default },
            { name: "ID", content: res.id },
            { name: "MajID", content: refId },
            { name: "Description", content: params.description },
            { name: "Modérateur", content: `${this.user.username} (${this.user.id})` }
        ])

        return this.warpper(res);
    }

    public async update(id: string, data: ICreate_Manga_ZOD, params: MangaParams) {
        this.needUser(this.user);
        this.needRoles(["MANGA_PATCH"], this.user.roles);
        const media = await this.getById(id);
        // Mettre un warning coté client pour prévenir au cas ou il y a des mise a jour en attente de validation avant de faire une modif
        const refId = genPublicID(8);
        const res = await this.build(data, { refId, isRequest: false, mangaId: media.id });
        res._id = media._id;

        await this.patchController.create({
            id: refId,
            type: "UPDATE",
            author: { id: this.user.id },
            target: { id: res.id },
            targetPath: "Manga",
            original: media.toJSON(),
            changes: DeepDiff.diff(media, res, {
                prefilter: (_, key) => (["__v", "_id", "id"].includes(key) ? false : true)
            }),
            status: "ACCEPTED",
            description: params.description,
            moderator: { id: this.user.id }
        });

        await media.updateOne(res).session(this.session);

        this.log?.add("Modification d'un manga", [
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
        this.needRoles(["MANGA_DELETE"], this.user.roles);
        const media = await this.getById(id);
        const deleted = await media.deleteOne().session(this.session);
        const refId = genPublicID(8);
        if (deleted.deletedCount > 0) {
            await this.patchController.create({
                id: refId,
                type: "DELETE",
                author: { id: this.user.id },
                target: { id: media.id },
                targetPath: "Manga",
                original: media.toJSON(),
                status: "ACCEPTED",
                reason: params.reason,
                moderator: { id: this.user.id }
            });

            this.log?.add("Suppresion d'un manga", [
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
        this.needRoles(["MANGA_VERIFY"], this.user.roles);
        const media = await this.getById(id);
        media.isVerified = true;
        await media.save({ session: this.session });
        return this.warpper(media);
    }

    public async unverify(id: string) {
        this.needUser(this.user);
        this.needRoles(["MANGA_VERIFY"], this.user.roles);
        const media = await this.getById(id);
        media.isVerified = false;
        await media.save({ session: this.session });
        return this.warpper(media);
    }

    public async create_request(data: ICreate_Manga_ZOD, params: MangaParams) {
        this.needUser(this.user);
        this.needRoles(["MANGA_ADD_REQUEST"], this.user.roles);
        const refId = genPublicID(8);
        const res = await this.build(data, { refId, isRequest: true });
        res.isVerified = false;

        await this.patchController.create({
            id: refId,
            type: "CREATE",
            author: { id: this.user.id },
            target: { id: res.id },
            targetPath: "Manga",
            original: res.toJSON(),
            status: "PENDING",
            description: params.description
        });

        await res.save({ session: this.session });

        this.log?.add("Demande de création d'un manga", [
            { name: "Nom", content: res.title.default },
            { name: "ID", content: res.id },
            { name: "MajID", content: refId },
            { name: "Description", content: params.description },
            { name: "Modérateur", content: `${this.user.username} (${this.user.id})` }
        ])

        return this.warpper(res);
    }

    public async update_request(id: string, data: ICreate_Manga_ZOD, params: MangaParams) {
        this.needUser(this.user);
        this.needRoles(["MANGA_PATCH_REQUEST"], this.user.roles);
        const media = await this.getById(id);
        // Mettre un warning coté client pour prévenir au cas ou il y a des mise a jour en attente de validation avant de faire une modif
        const refId = genPublicID(8);
        const res = await this.build(data, { refId, isRequest: true, mangaId: media.id });
        res._id = media._id;

        await this.patchController.create({
            id: refId,
            type: "UPDATE",
            author: { id: this.user.id },
            target: { id: res.id },
            targetPath: "Manga",
            original: media.toJSON(),
            changes: DeepDiff.diff(media, res, {
                prefilter: (_, key) => (["__v", "_id", "id"].includes(key) ? false : true)
            }),
            status: "PENDING",
            description: params.description
        });

        this.log?.add("Demande de modification d'un manga", [
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
        const patchs = await this.patchController.fitlerPatchFrom("Manga", res.id, "PENDING");
        return patchs.length > 0;
    }
}

export { MangaController };