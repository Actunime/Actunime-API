import { ClientSession, Document, Schema } from "mongoose";
import { APIError } from "../_lib/Error";
import { ICharacter, ITargetPath, IUser } from "@actunime/types";
import { PaginationControllers } from "./pagination.controllers";
import { z } from "zod";
import { CharacterPaginationBody, ICharacterBody, IMediaDeleteBody } from "@actunime/validations";
import { UtilControllers } from "../_utils/_controllers";
import DeepDiff from 'deep-diff';
import { DevLog } from "../_lib/logger";
import { genPublicID } from "@actunime/utils";
import { PersonController } from "./person.controler";
import { ImageController } from "./image.controller";
import LogSession from "../_utils/_logSession";
import { PatchController } from "./patch.controllers";
import { CharacterModel } from "../_lib/models";

type ICharacterDoc = (Document<unknown, unknown, ICharacter> & ICharacter & Required<{
    _id: Schema.Types.ObjectId;
}> & {
    __v: number;
}) | null;

interface ICharacterResponse extends ICharacter {
    parsedCharacter: () => Partial<ICharacter> | null
}

type ICharacterControlled = ICharacterDoc & ICharacterResponse

interface CharacterParams {
    refId: string,
    description?: string,
}

class CharacterController extends UtilControllers.withUser {
    private patchController: PatchController;
    private targetPath: ITargetPath = "Character";

    constructor(session?: ClientSession | null, options?: { log?: LogSession, user?: IUser }) {
        super({ session, ...options });
        this.patchController = new PatchController(session, options);
    }


    parse(Character: Partial<ICharacter>) {
        // delete Character._id;

        return Character;
    }

    warpper(data: ICharacterDoc): ICharacterControlled {
        if (!data)
            throw new APIError("Aucun personnage n'a été trouvé", "NOT_FOUND");

        const res = data as ICharacterControlled;
        res.parsedCharacter = this.parse.bind(this, data)

        return res;
    }

    async getById(id: string) {
        DevLog(`Récupération du personnage ID: ${id}`, "debug");
        const promise = CharacterModel.findOne({ id });
        if (this.session) promise.session(this.session); else promise.cache("60m");
        const res = await promise;
        DevLog(`Personnage ${res ? "trouvée" : "non trouvée"}, ID Personnage: ${id}`, "debug");
        return this.warpper(res);
    }

    async filter(pageFilter: z.infer<typeof CharacterPaginationBody>) {
        DevLog("Filtrage des personnages...", "debug");
        const pagination = new PaginationControllers(CharacterModel);

        pagination.useFilter(pageFilter);

        const res = await pagination.getResults();

        DevLog(`Personnages trouvées: ${res.resultsCount}`, "debug");
        return res;
    }
    async build(input: ICharacterBody, params: { refId: string, isRequest: boolean, characterId?: string }) {
        const { actors, avatar, ...rawCharacter } = input;
        const character: Partial<ICharacter> & { id: string } = {
            ...rawCharacter,
            id: params.characterId || genPublicID(8)
        };
        const user = this.user;
        this.needUser(user);

        DevLog(`Build character... ID: ${character.id}`, "debug");

        const session = this.session;
        const { refId, isRequest } = params;

        if (avatar && (avatar.id || avatar.newImage)) {
            DevLog(`Ajout de l'image au personnage... ${avatar.id ? `ID: ${avatar.id}` : `Nouvelle image: ${JSON.stringify(avatar.newImage)}`}`, "debug");
            const imageController = new ImageController(session, { log: this.log, user });
            const getImage = avatar.id ? await imageController.getById(avatar.id) :
                isRequest ?
                    await imageController.create_request(avatar.newImage!, { refId, target: { id: character.id }, targetPath: "Character" }) :
                    await imageController.create(avatar.newImage!, { refId, target: { id: character.id }, targetPath: "Character" })
            DevLog(`Image ajoutée au personnage, ID: ${getImage.id}`, "debug");
            character.avatar = { id: getImage.id };
        }

        if (actors && actors.length > 0) {
            DevLog(`Ajout des acteurs au personnage...`, "debug");
            const personController = new PersonController(session, { log: this.log, user });
            const getActors = await Promise.all(
                actors.map(async (person) => {
                    if (person && (person.id || person.newPerson)) {
                        DevLog(`Ajout de l'acteur au personnage... ${person.id ? `ID: ${person.id}` : `Nouvelle personne: ${JSON.stringify(person.newPerson)}`}`, "debug");
                        const getPerson = person.id ? await personController.getById(person.id) :
                            isRequest ?
                                await personController.create_request(person.newPerson!, { refId }) :
                                await personController.create(person.newPerson!, { refId })
                        DevLog(`Acteur ajoutée au personnage, ID: ${getPerson.id}`, "debug");
                        return { id: getPerson.id };
                    }
                }))
            character.actors = getActors.filter((person) => person) as { id: string }[];
        }

        return new CharacterModel(character);
    }

    public async create(data: ICharacterBody, params: CharacterParams) {
        DevLog("Création de personnage...", "debug");
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

        this.log?.add("Création d'un personnage", [
            { name: "Nom", content: res.name },
            { name: "ID", content: res.id },
            { name: "MajID", content: patchID },
            { name: "Description", content: params.description },
            { name: "Modérateur", content: `${this.user.username} (${this.user.id})` }
        ])

        DevLog(`Personnage créé, Maj crée... ID Personnage: ${res.id}, ID Maj: ${patchID}`, "debug");
        return this.warpper(res);
    }


    public async update(id: string, data: ICharacterBody, params: Omit<CharacterParams, "refId">) {
        DevLog("Modification de personnage...", "debug");
        this.needUser(this.user);
        const media = await this.getById(id);
        // Mettre un warning coté client pour prévenir au cas ou il y a des mise a jour en attente de validation avant de faire une modif
        const refId = genPublicID(8);
        const res = await this.build(data, { refId, isRequest: false, characterId: media.id });
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

        this.log?.add("Modification d'un personnage", [
            { name: "Nom", content: res.name },
            { name: "ID", content: res.id },
            { name: "MajID", content: refId },
            { name: "Description", content: params.description },
            { name: "Modérateur", content: `${this.user.username} (${this.user.id})` }
        ])

        DevLog(`Personnage modifié, Maj crée... ID Personnage: ${res.id}, ID Maj: ${refId}`, "debug");
        return this.warpper(res);
    }

    public async delete(id: string, params: IMediaDeleteBody) {
        DevLog("Suppression de personnage...", "debug");
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

            this.log?.add("Suppresion d'un personnage", [
                { name: "Nom", content: media.name },
                { name: "ID", content: media.id },
                { name: "Raison", content: params.reason },
                { name: "Modérateur", content: `${this.user.username} (${this.user.id})` }
            ])

            DevLog(`Personnage supprimé, ID Personnage: ${media.id}, ID Maj: ${refId}`, "debug");
            return true;
        }

        DevLog(`Personnage non supprimé, ID Personnage: ${media.id}`, "debug");
        return false;
    }

    public async verify(id: string) {
        DevLog("Verification de personnage...", "debug");
        this.needUser(this.user);
        const media = await this.getById(id);
        media.isVerified = true;
        await media.save({ session: this.session });
        DevLog(`Personnage verifié, ID Personnage: ${media.id}`, "debug");
        return this.warpper(media);
    }

    public async unverify(id: string) {
        DevLog("Verification de personnage...", "debug");
        this.needUser(this.user);
        const media = await this.getById(id);
        media.isVerified = false;
        await media.save({ session: this.session });
        DevLog(`Personnage non verifié, ID Personnage: ${media.id}`, "debug");
        return this.warpper(media);
    }

    public async create_request(data: ICharacterBody, params: CharacterParams) {
        DevLog("Demande de création de personnage...", "debug");
        this.needUser(this.user);
        const refId = genPublicID(8);
        const res = await this.build(data, { refId, isRequest: true });
        res.isVerified = false;

        await this.patchController.create({
            id: refId,
            type: "CREATE",
            author: { id: this.user.id },
            target: { id: res.id },
            targetPath: "Character",
            original: res.toJSON(),
            status: "PENDING",
            description: params.description
        });

        await res.save({ session: this.session });

        this.log?.add("Demande de création d'un personnage", [
            { name: "Nom", content: res.name },
            { name: "ID", content: res.id },
            { name: "MajID", content: refId },
            { name: "Description", content: params.description },
            { name: "Modérateur", content: `${this.user.username} (${this.user.id})` }
        ])

        DevLog(`Personnage créé, Demande crée... ID Personnage: ${res.id}, ID Demande: ${refId}`, "debug");
        return this.warpper(res);
    }

    public async update_request(id: string, data: ICharacterBody, params: CharacterParams) {
        DevLog("Demande de modification de personnage...", "debug");
        this.needUser(this.user);
        const media = await this.getById(id);
        // Mettre un warning coté client pour prévenir au cas ou il y a des mise a jour en attente de validation avant de faire une modif
        const refId = genPublicID(8);
        const res = await this.build(data, { refId, isRequest: true, characterId: media.id });
        res._id = media._id;

        await this.patchController.create({
            id: refId,
            type: "UPDATE",
            author: { id: this.user.id },
            target: { id: res.id },
            targetPath: "Character",
            original: media.toJSON(),
            changes: DeepDiff.diff(media, res, {
                prefilter: (_, key) => (["__v", "_id", "id"].includes(key) ? false : true)
            }),
            status: "PENDING",
            description: params.description
        });


        this.log?.add("Demande de modification d'un personnage", [
            { name: "Nom", content: res.name },
            { name: "ID", content: res.id },
            { name: "MajID", content: refId },
            { name: "Description", content: params.description },
            { name: "Modérateur", content: `${this.user.username} (${this.user.id})` }
        ])

        DevLog(`Personnage modifié, Demande crée... ID Personnage: ${res.id}, ID Demande: ${refId}`, "debug");
        return this.warpper(res);
    }
}

export { CharacterController };