import { ClientSession, Document, Schema } from "mongoose";
import { APIError } from "../_lib/Error";
import { IPerson, IUser, ITargetPath } from "@actunime/types";
import { PaginationControllers } from "./pagination.controllers";
import { z } from "zod";
import { PersonPaginationBody, IPersonBody, IMediaDeleteBody } from "@actunime/validations";
import { UtilControllers } from "../_utils/_controllers";
import DeepDiff from 'deep-diff';
import { DevLog } from "../_lib/logger";
import { genPublicID } from "@actunime/utils";
import { ImageController } from "./image.controller";
import LogSession from "../_utils/_logSession";
import { PatchController } from "./patch.controllers";
import { PersonModel } from "../_lib/models";

type IPersonDoc = (Document<unknown, unknown, IPerson> & IPerson & Required<{
    _id: Schema.Types.ObjectId;
}> & {
    __v: number;
}) | null;

interface IPersonResponse extends IPerson {
    parsedPerson: () => Partial<IPerson> | null
}

type IPersonControlled = IPersonDoc & IPersonResponse

interface PersonParams {
    refId: string,
    description?: string,
}

class PersonController extends UtilControllers.withUser {
    private patchController: PatchController;
    private targetPath: ITargetPath = "Person";

    constructor(session?: ClientSession | null, options?: { log?: LogSession, user?: IUser }) {
        super({ session, ...options });
        this.patchController = new PatchController(session, options);
    }


    parse(Person: Partial<IPerson>) {
        // delete Person._id;

        return Person;
    }

    warpper(data: IPersonDoc): IPersonControlled {
        if (!data)
            throw new APIError("Aucune personne n'a été trouvé", "NOT_FOUND");

        const res = data as IPersonControlled;
        res.parsedPerson = this.parse.bind(this, data)

        return res;
    }

    async getById(id: string) {
        DevLog(`Récupération de la personne ID: ${id}`, "debug");
        const promise = PersonModel.findOne({ id });
        if (this.session) promise.session(this.session); else promise.cache("60m");
        const res = await promise;
        DevLog(`Personne ${res ? "trouvée" : "non trouvée"}, ID Personne: ${id}`, "debug");
        return this.warpper(res);
    }

    async filter(pageFilter: z.infer<typeof PersonPaginationBody>) {
        DevLog("Filtrage des personnes...", "debug");
        const pagination = new PaginationControllers(PersonModel);

        pagination.useFilter(pageFilter);

        const res = await pagination.getResults();

        DevLog(`Personnes trouvées: ${res.resultsCount}`, "debug");
        return res;
    }

    async build(input: IPersonBody, params: { refId: string, isRequest: boolean, personId?: string }) {
        const { avatar, ...rawPerson } = input;
        const person: Partial<IPerson> & { id: string } = {
            ...rawPerson,
            id: params.personId || genPublicID(8)
        };
        const user = this.user;
        this.needUser(user);
        const session = this.session;
        const { refId, isRequest } = params;
        DevLog(`Build de la personne...`, "debug");

        if (avatar && (avatar.id || avatar.newImage)) {
            DevLog(`Ajout de l'image a la Personne... ${avatar.id ? `ID: ${avatar.id}` : `Nouvelle image: ${JSON.stringify(avatar.newImage)}`}`, "debug");
            const imageController = new ImageController(session, { log: this.log, user });
            const getImage = avatar.id ? await imageController.getById(avatar.id) :
                isRequest ?
                    await imageController.create_request(avatar.newImage!, { refId, target: { id: person.id }, targetPath: this.targetPath }) :
                    await imageController.create(avatar.newImage!, { refId, target: { id: person.id }, targetPath: this.targetPath })
            DevLog(`Image ajoutée, ID Image: ${getImage.id}`, "debug");
            person.avatar = { id: getImage.id };
        }

        return new PersonModel(person);
    }


    public async create(data: IPersonBody, params: PersonParams) {
        DevLog("Création d'une personne...", "debug");
        this.needUser(this.user);
        const patchID = genPublicID(8);
        const res = await this.build(data, { refId: patchID, isRequest: false });
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

        this.log?.add("Création d'une personne (staff, acteur, etc)", [
            { name: "Nom", content: res.name },
            { name: "ID", content: res.id },
            { name: "MajID", content: patchID },
            { name: "Description", content: params.description },
            { name: "Modérateur", content: `${this.user.username} (${this.user.id})` }
        ])

        DevLog(`Personne crée, Demande crée... ID Personne: ${res.id}, ID Demande: ${patchID}`, "debug");
        return this.warpper(res);
    }


    public async update(id: string, data: IPersonBody, params: Omit<PersonParams, "refId">) {
        DevLog("Mise à jour d'une personne...", "debug");
        this.needUser(this.user);
        const media = await this.getById(id);
        // Mettre un warning coté client pour prévenir au cas ou il y a des mise a jour en attente de validation avant de faire une modif
        const refId = genPublicID(8);
        const res = await this.build(data, { refId, isRequest: false, personId: media.id });
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

        this.log?.add("Modification d'un person", [
            { name: "Nom", content: res.name },
            { name: "ID", content: res.id },
            { name: "MajID", content: refId },
            { name: "Description", content: params.description },
            { name: "Modérateur", content: `${this.user.username} (${this.user.id})` }
        ])

        DevLog(`Personne mise à jour, Demande crée... ID Personne: ${res.id}, ID Demande: ${refId}`, "debug");
        return this.warpper(res);
    }

    public async delete(id: string, params: IMediaDeleteBody) {
        DevLog("Suppression d'une personne...", "debug");
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

            this.log?.add("Suppresion d'un person", [
                { name: "Nom", content: media.name },
                { name: "ID", content: media.id },
                { name: "Raison", content: params.reason },
                { name: "Modérateur", content: `${this.user.username} (${this.user.id})` }
            ])

            DevLog(`Personne supprimé, Demande crée... ID Personne: ${media.id}, ID Demande: ${refId}`, "debug");
            return true;
        }

        DevLog(`Personne non supprimé, ID Personne: ${media.id}`, "debug");
        return false;
    }

    public async verify(id: string) {
        DevLog("Verification de personne...", "debug");
        this.needUser(this.user);
        const media = await this.getById(id);
        media.isVerified = true;
        await media.save({ session: this.session });
        DevLog(`Personne verifiée, ID Personne: ${media.id}`, "debug");
        return this.warpper(media);
    }

    public async unverify(id: string) {
        DevLog("Verification de personne...", "debug");
        this.needUser(this.user);
        const media = await this.getById(id);
        media.isVerified = false;
        await media.save({ session: this.session });
        DevLog(`Personne non verifiée, ID Personne: ${media.id}`, "debug");
        return this.warpper(media);
    }

    public async create_request(data: IPersonBody, params: PersonParams) {
        DevLog("Demande de création de personne...", "debug");
        this.needUser(this.user);
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

        this.log?.add("Demande de création d'un person", [
            { name: "Nom", content: res.name },
            { name: "ID", content: res.id },
            { name: "MajID", content: refId },
            { name: "Description", content: params.description },
            { name: "Modérateur", content: `${this.user.username} (${this.user.id})` }
        ])

        DevLog(`Personne crée, Demande crée... ID Personne: ${res.id}, ID Demande: ${refId}`, "debug");
        return this.warpper(res);
    }

    public async update_request(id: string, data: IPersonBody, params: PersonParams) {
        DevLog("Demande de modification de personne...", "debug");
        this.needUser(this.user);
        const media = await this.getById(id);
        // Mettre un warning coté client pour prévenir au cas ou il y a des mise a jour en attente de validation avant de faire une modif
        const refId = genPublicID(8);
        const res = await this.build(data, { refId, isRequest: true, personId: media.id });
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


        this.log?.add("Demande de modification d'un person", [
            { name: "Nom", content: res.name },
            { name: "ID", content: res.id },
            { name: "MajID", content: refId },
            { name: "Description", content: params.description },
            { name: "Modérateur", content: `${this.user.username} (${this.user.id})` }
        ])

        DevLog(`Demande crée... ID Personne: ${res.id}, ID Demande: ${refId}`, "debug");
        return this.warpper(res);
    }
}

export { PersonController };