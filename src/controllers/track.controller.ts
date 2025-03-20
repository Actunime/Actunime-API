import { ClientSession, Document, Schema } from "mongoose";
import { APIError } from "../_lib/Error";
import { ITrack, ITargetPath, IUser } from "@actunime/types";
import { PaginationControllers } from "./pagination.controllers";
import { z } from "zod";
import { TrackPaginationBody, ITrackBody, IMediaDeleteBody } from "@actunime/validations";
import { UtilControllers } from "../_utils/_controllers";
import DeepDiff from 'deep-diff';
import { DevLog } from "../_lib/logger";
import { genPublicID } from "@actunime/utils";
import { PersonController } from "./person.controler";
import { ImageController } from "./image.controller";
import LogSession from "../_utils/_logSession";
import { PatchController } from "./patch.controllers";
import { TrackModel } from "../_lib/models";

type ITrackDoc = (Document<unknown, unknown, ITrack> & ITrack & Required<{
    _id: Schema.Types.ObjectId;
}> & {
    __v: number;
}) | null;

interface ITrackResponse extends ITrack {
    parsedTrack: () => Partial<ITrack> | null
}

type ITrackControlled = ITrackDoc & ITrackResponse

interface TrackParams {
    refId: string,
    description?: string,
}

class TrackController extends UtilControllers.withUser {
    private patchController: PatchController;
    private targetPath: ITargetPath = "Track";

    constructor(session?: ClientSession | null, options?: { log?: LogSession, user?: IUser }) {
        super({ session, ...options });
        this.patchController = new PatchController(session, options);
    }


    parse(Track: Partial<ITrack>) {
        // delete Track._id;

        return Track;
    }

    warpper(data: ITrackDoc): ITrackControlled {
        if (!data)
            throw new APIError("Aucune musique n'a été trouvé", "NOT_FOUND");

        const res = data as ITrackControlled;
        res.parsedTrack = this.parse.bind(this, data)

        return res;
    }

    async getById(id: string) {
        DevLog(`Récupération de la musique ID: ${id}`, "debug");
        const promise = TrackModel.findOne({ id });
        if (this.session) promise.session(this.session); else promise.cache("60m");
        const res = await promise;
        DevLog(`Musique ${res ? "trouvée" : "non trouvée"}, ID Musique: ${id}`, "debug");
        return this.warpper(res);
    }

    async filter(pageFilter: z.infer<typeof TrackPaginationBody>) {
        DevLog("Filtrage des musiques...", "debug");
        const pagination = new PaginationControllers(TrackModel);

        pagination.useFilter(pageFilter);

        const res = await pagination.getResults();

        DevLog(`Musiques trouvées: ${res.resultsCount}`, "debug");
        return res;
    }
    async build(input: ITrackBody, params: { refId: string, isRequest: boolean, trackId?: string }) {
        const { artists, cover, ...rawTrack } = input;
        const track: Partial<ITrack> & { id: string } = {
            ...rawTrack,
            id: params.trackId || genPublicID(8)
        };
        const user = this.user;
        this.needUser(user);
        const session = this.session;
        const { refId, isRequest } = params;
        DevLog("Build de musique...", "debug");
        if (cover && (cover.id || cover.newImage)) {
            DevLog(`Ajout de l'image a la musique... ${cover.id ? `ID: ${cover.id}` : `Nouvelle image: ${JSON.stringify(cover.newImage)}`}`, "debug");
            const imageController = new ImageController(session, { log: this.log, user });
            const getImage = cover.id ? await imageController.getById(cover.id) :
                isRequest ?
                    await imageController.create_request(cover.newImage!, { refId, target: { id: track.id }, targetPath: "Track" }) :
                    await imageController.create(cover.newImage!, { refId, target: { id: track.id }, targetPath: "Track" })
            DevLog(`Image ajoutée, ID Image: ${getImage.id}`, "debug");
            track.cover = { id: getImage.id };
        }

        if (artists && artists.length > 0) {
            DevLog("Ajout des artistes...", "debug");
            const personController = new PersonController(session, { log: this.log, user });
            const getActors = await Promise.all(
                artists.map(async (person) => {
                    if (person && (person.id || person.newPerson)) {
                        DevLog(`Ajout de l'artiste... ${person.id ? `ID: ${person.id}` : `Nouvelle personne: ${JSON.stringify(person.newPerson)}`}`, "debug");
                        const getPerson = person.id ? await personController.getById(person.id) :
                            isRequest ?
                                await personController.create_request(person.newPerson!, { refId }) :
                                await personController.create(person.newPerson!, { refId })
                        DevLog(`Personne ajoutée, ID Personne: ${getPerson.id}`, "debug");
                        return { id: getPerson.id };
                    }
                }))
            track.artists = getActors.filter((person) => person) as { id: string }[];
        }

        return new TrackModel(track);
    }

    public async create(data: ITrackBody, params: TrackParams) {
        DevLog("Création de musique...", "debug");
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

        this.log?.add("Création d'une musique", [
            { name: "Nom", content: res.name },
            { name: "ID", content: res.id },
            { name: "MajID", content: patchID },
            { name: "Description", content: params.description },
            { name: "Modérateur", content: `${this.user.username} (${this.user.id})` }
        ])

        DevLog(`Musique crée, ID Musique: ${res.id}`, "debug");
        return this.warpper(res);
    }


    public async update(id: string, data: ITrackBody, params: Omit<TrackParams, "refId">) {
        DevLog("Mise à jour de musique...", "debug");
        this.needUser(this.user);
        const media = await this.getById(id);
        // Mettre un warning coté client pour prévenir au cas ou il y a des mise a jour en attente de validation avant de faire une modif
        const refId = genPublicID(8);
        const res = await this.build(data, { refId, isRequest: false, trackId: media.id });
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

        this.log?.add("Modification d'une musique", [
            { name: "Nom", content: res.name },
            { name: "ID", content: res.id },
            { name: "MajID", content: refId },
            { name: "Description", content: params.description },
            { name: "Modérateur", content: `${this.user.username} (${this.user.id})` }
        ])

        DevLog(`Musique mise à jour, ID Musique: ${res.id}`, "debug");
        return this.warpper(res);
    }

    public async delete(id: string, params: IMediaDeleteBody) {
        DevLog("Suppression de musique...", "debug");
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

            this.log?.add("Suppresion d'une musique", [
                { name: "Nom", content: media.name },
                { name: "ID", content: media.id },
                { name: "Raison", content: params.reason },
                { name: "Modérateur", content: `${this.user.username} (${this.user.id})` }
            ])

            DevLog(`Musique supprimé, Demande crée... ID Musique: ${media.id}, ID Demande: ${refId}`, "debug");
            return true;
        }

        DevLog(`Musique non supprimé, ID Musique: ${media.id}`, "debug");
        return false;
    }

    public async verify(id: string) {
        DevLog("Verification de musique...", "debug");
        this.needUser(this.user);
        const media = await this.getById(id);
        media.isVerified = true;
        await media.save({ session: this.session });
        DevLog(`Musique verifiée, ID Musique: ${media.id}`, "debug");
        return this.warpper(media);
    }

    public async unverify(id: string) {
        DevLog("Verification de musique...", "debug");
        this.needUser(this.user);
        const media = await this.getById(id);
        media.isVerified = false;
        await media.save({ session: this.session });
        DevLog(`Musique non verifiée, ID Musique: ${media.id}`, "debug");
        return this.warpper(media);
    }

    public async create_request(data: ITrackBody, params: TrackParams) {
        DevLog("Demande de création de musique...", "debug");
        this.needUser(this.user);
        const refId = genPublicID(8);
        const res = await this.build(data, { refId, isRequest: true });
        res.isVerified = false;

        await this.patchController.create({
            id: refId,
            type: "CREATE",
            author: { id: this.user.id },
            target: { id: res.id },
            targetPath: "Track",
            original: res.toJSON(),
            status: "PENDING",
            description: params.description
        });

        await res.save({ session: this.session });

        this.log?.add("Demande de création d'une musique", [
            { name: "Nom", content: res.name },
            { name: "ID", content: res.id },
            { name: "MajID", content: refId },
            { name: "Description", content: params.description },
            { name: "Modérateur", content: `${this.user.username} (${this.user.id})` }
        ])

        DevLog(`Musique crée, Demande crée... ID Musique: ${res.id}, ID Demande: ${refId}`, "debug");
        return this.warpper(res);
    }

    public async update_request(id: string, data: ITrackBody, params: TrackParams) {
        DevLog("Demande de modification de musique...", "debug");
        this.needUser(this.user);
        const media = await this.getById(id);
        // Mettre un warning coté client pour prévenir au cas ou il y a des mise a jour en attente de validation avant de faire une modif
        const refId = genPublicID(8);
        const res = await this.build(data, { refId, isRequest: true, trackId: media.id });
        res._id = media._id;

        await this.patchController.create({
            id: refId,
            type: "UPDATE",
            author: { id: this.user.id },
            target: { id: res.id },
            targetPath: "Track",
            original: media.toJSON(),
            changes: DeepDiff.diff(media, res, {
                prefilter: (_, key) => (["__v", "_id", "id"].includes(key) ? false : true)
            }),
            status: "PENDING",
            description: params.description
        });


        this.log?.add("Demande de modification d'une musique", [
            { name: "Nom", content: res.name },
            { name: "ID", content: res.id },
            { name: "MajID", content: refId },
            { name: "Description", content: params.description },
            { name: "Modérateur", content: `${this.user.username} (${this.user.id})` }
        ])

        DevLog(`Demande crée... ID Musique: ${res.id}, ID Demande: ${refId}`, "debug");
        return this.warpper(res);
    }
}

export { TrackController };