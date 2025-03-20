import { ClientSession, Document, Schema } from "mongoose";
import { APIError } from "../_lib/Error";
import { IManga, IUser } from "@actunime/types";
import { PaginationControllers } from "./pagination.controllers";
import { z } from "zod";
import { MangaPaginationBody, IMangaBody, IMediaDeleteBody } from "@actunime/validations";
import { UtilControllers } from "../_utils/_controllers";
import DeepDiff from 'deep-diff';
import { GroupeController } from "./groupe.controller";
import { ImageController } from "./image.controller";
import { CompanyController } from "./company.controller";
import { PersonController } from "./person.controler";
import { CharacterController } from "./character.controller";
import LogSession from "../_utils/_logSession";
import { DevLog } from "../_lib/logger";
import { genPublicID } from "@actunime/utils";
import { PatchController } from "./patch.controllers";
import { MangaModel } from "../_lib/models";

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
    private patchController: PatchController;
    constructor(session: ClientSession | null, options?: { log?: LogSession, user?: IUser }) {
        super({ session, ...options });
        this.patchController = new PatchController(session, options);
    }

    parse(Manga: Partial<IManga>) {
        // delete Manga._id;

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
        DevLog(`Récupération du manga ID: ${id}`, "debug");
        const promise = MangaModel.findOne({ id });
        if (this.session) promise.session(this.session); else promise.cache("60m");
        const res = await promise;
        DevLog(`Manga ${res ? "trouvée" : "non trouvée"}, ID Manga: ${id}`, "debug");
        return this.warpper(res);
    }

    async filter(pageFilter?: z.infer<typeof MangaPaginationBody>) {
        DevLog("Filtrage des mangas...", "debug");
        const pagination = new PaginationControllers(MangaModel);

        pagination.useFilter(pageFilter);

        const res = await pagination.getResults();

        DevLog(`Mangas trouvées: ${res.resultsCount}`, "debug");
        return res;
    }

    async build(input: IMangaBody, params: { refId: string, isRequest: boolean, mangaId?: string }) {
        const { groupe, parent, cover, banner, companys, staffs, characters, ...rawManga } = input;
        const manga: Partial<IManga> & { id: string } = {
            ...rawManga,
            id: params.mangaId || genPublicID(8)
        };
        const user = this.user;
        this.needUser(user);
        const session = this.session;
        const { refId, isRequest } = params;

        DevLog(`Manga build...`, "debug");

        if (groupe && (groupe.id || groupe.newGroupe)) {
            DevLog(`Ajout du groupe au manga... ${groupe.id ? `ID: ${groupe.id}` : `Nouveau groupe: ${JSON.stringify(groupe.newGroupe)}`}`, "debug");
            const groupeController = new GroupeController(session, { log: this.log, user });
            const getGroupe = groupe.id ? await groupeController.getById(groupe.id) :
                isRequest ?
                    await groupeController.create_request(groupe.newGroupe!, { refId }) :
                    await groupeController.create(groupe.newGroupe!, { refId })
            DevLog(`Groupe ajouté au manga, ID Groupe: ${getGroupe.id}`, "debug");
            manga.groupe = { id: getGroupe.id };
        }

        if (parent && parent.id) {
            DevLog(`Ajout du parent au manga... ID: ${parent.id}`, "debug");
            const getParent = await this.getById(parent.id);
            manga.parent = { id: getParent.id };
            DevLog(`Parent ajouté au manga, ID Parent: ${getParent.id}`, "debug");
        }

        if (cover || banner) {
            const imageController = new ImageController(session, { log: this.log, user });

            if (cover && (cover.id || cover.newImage)) {
                DevLog(`Ajout de la couverture au manga... ${cover.id ? `ID: ${cover.id}` : `Nouvelle couverture: ${JSON.stringify(cover.newImage)}`}`, "debug");
                const getImage = cover.id ? await imageController.getById(cover.id) :
                    isRequest ?
                        await imageController.create_request(cover.newImage!, { refId, target: { id: manga.id }, targetPath: "Manga" }) :
                        await imageController.create(cover.newImage!, { refId, target: { id: manga.id }, targetPath: "Manga" })
                manga.cover = { id: getImage.id };
                DevLog(`Couverture ajoutée au manga, ID Couverture: ${getImage.id}`, "debug");
            }

            if (banner && (banner.id || banner.newImage)) {
                DevLog(`Ajout de la bannière au manga... ${banner.id ? `ID: ${banner.id}` : `Nouvelle bannière: ${JSON.stringify(banner.newImage)}`}`, "debug");
                const getImage = banner.id ? await imageController.getById(banner.id) :
                    isRequest ?
                        await imageController.create_request(banner.newImage!, { refId, target: { id: manga.id }, targetPath: "Manga" }) :
                        await imageController.create(banner.newImage!, { refId, target: { id: manga.id }, targetPath: "Manga" })
                manga.banner = { id: getImage.id };
                DevLog(`Bannière ajouté au manga, ID bannière: ${getImage.id}`, "debug");
            }
        }

        // if (manga && manga.id)
        //     manga.manga = await new MangaController(session, { log: this.log, user }).create_relation(manga);

        if (companys && companys.length > 0) {
            DevLog(`Ajout des sociétées au manga...`, "debug");
            const companyController = new CompanyController(session, { log: this.log, user });
            const getActors = await Promise.all(
                companys.map(async (company) => {
                    if (company && (company.id || company.newCompany)) {
                        DevLog(`Ajout de la société au manga... ${company.id ? `ID: ${company.id}` : `Nouvelle société: ${JSON.stringify(company.newCompany)}`}`, "debug");
                        const getCompany = company.id ? await companyController.getById(company.id) :
                            isRequest ?
                                await companyController.create_request(company.newCompany!, { refId }) :
                                await companyController.create(company.newCompany!, { refId })
                        DevLog(`Société ajoutée au manga, ID Société: ${getCompany.id}`, "debug");
                        return { id: getCompany.id };
                    }
                }))
            manga.companys = getActors.filter((company) => company) as typeof manga.companys;
        }

        if (staffs && staffs.length > 0) {
            DevLog(`Ajout des acteurs au manga...`, "debug");
            const staffController = new PersonController(session, { log: this.log, user });
            const getActors = await Promise.all(
                staffs.map(async (staff) => {
                    if (staff && (staff.id || staff.newPerson)) {
                        DevLog(`Ajout de l'acteur au manga... ${staff.id ? `ID: ${staff.id}` : `Nouvel acteur: ${JSON.stringify(staff.newPerson)}`}`, "debug");
                        const getStaff = staff.id ? await staffController.getById(staff.id) :
                            isRequest ?
                                await staffController.create_request(staff.newPerson!, { refId }) :
                                await staffController.create(staff.newPerson!, { refId })
                        DevLog(`Acteur ajouté au manga, ID Acteur: ${getStaff.id}`, "debug");
                        return { id: getStaff.id, role: staff.role };
                    }
                }))
            manga.staffs = getActors.filter((staff) => staff) as typeof manga.staffs;
        }

        if (characters && characters.length > 0) {
            DevLog(`Ajout des personnages au manga...`, "debug");
            const characterController = new CharacterController(session, { log: this.log, user });
            const getActors = await Promise.all(
                characters.map(async (character) => {
                    if (character && (character.id || character.newCharacter)) {
                        DevLog(`Ajout du personnage au manga... ${character.id ? `ID: ${character.id}` : `Nouveau personnage: ${JSON.stringify(character.newCharacter)}`}`, "debug");
                        const getCharacter = character.id ? await characterController.getById(character.id) :
                            isRequest ?
                                await characterController.create_request(character.newCharacter!, { refId }) :
                                await characterController.create(character.newCharacter!, { refId })
                        DevLog(`Personnage ajouté au manga, ID Personnage: ${getCharacter.id}`, "debug");
                        return { id: getCharacter.id, role: character.role };
                    }
                }))
            manga.characters = getActors.filter((character) => character) as typeof manga.characters;
        }

        return new MangaModel(manga);
    }

    public async create(data: IMangaBody, params: MangaParams) {
        DevLog("Création d'un manga...", "debug");
        this.needUser(this.user);
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

        DevLog(`Manga crée, Demande crée... ID Manga: ${res.id}, ID Demande: ${refId}`, "debug");
        return this.warpper(res);
    }

    public async update(id: string, data: IMangaBody, params: MangaParams) {
        DevLog("Mise à jour d'un manga...", "debug");
        this.needUser(this.user);
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

        DevLog(`Manga mis à jour, Demande crée... ID Manga: ${res.id}, ID Demande: ${refId}`, "debug");
        return this.warpper(res);
    }

    public async delete(id: string, params: IMediaDeleteBody) {
        DevLog("Suppression d'un manga...", "debug");
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

            DevLog(`Manga supprimé, Demande crée... ID Manga: ${media.id}, ID Demande: ${refId}`, "debug");
            return true;
        }

        DevLog(`Manga non supprimé, ID Manga: ${media.id}`, "debug");
        return false;
    }

    public async verify(id: string) {
        DevLog("Verification de manga...", "debug");
        this.needUser(this.user);
        const media = await this.getById(id);
        media.isVerified = true;
        await media.save({ session: this.session });
        DevLog(`Manga verifiée, ID Manga: ${media.id}`, "debug");
        return this.warpper(media);
    }

    public async unverify(id: string) {
        DevLog("Verification de manga...", "debug");
        this.needUser(this.user);
        const media = await this.getById(id);
        media.isVerified = false;
        await media.save({ session: this.session });
        DevLog(`Manga non verifiée, ID Manga: ${media.id}`, "debug");
        return this.warpper(media);
    }

    public async create_request(data: IMangaBody, params: MangaParams) {
        DevLog("Demande de création de manga...", "debug");
        this.needUser(this.user);
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

        DevLog(`Manga crée, Demande crée... ID Manga: ${res.id}, ID Demande: ${refId}`, "debug");
        return this.warpper(res);
    }

    public async update_request(id: string, data: IMangaBody, params: MangaParams) {
        DevLog("Demande de modification de manga...", "debug");
        this.needUser(this.user);
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

        DevLog(`Demande crée... ID Manga: ${res.id}, ID Demande: ${refId}`, "debug");
        return this.warpper(res);
    }

    private async hasPendingPatch(id: string) {
        const res = await this.getById(id);
        const patchs = await this.patchController.fitlerPatchFrom("Manga", res.id, "PENDING");
        return patchs.length > 0;
    }
}

export { MangaController };