import { TrackModel } from "@actunime/mongoose-models";
import { ClientSession, Document, Schema } from "mongoose";
import { APIError } from "../_lib/Error";
import { ITrack, ITargetPath, IUser } from "@actunime/types";
import { PaginationControllers } from "./pagination.controllers";
import { z } from "zod";
import { TrackPaginationBody, ICreate_Track_ZOD, IMediaDeleteBody } from "@actunime/validations";
import { UtilControllers } from "../_utils/_controllers";
import { PatchController } from "./patch.controllers";
import DeepDiff from 'deep-diff';
import { genPublicID } from "@actunime/utils";
import { PersonController } from "./person.controler";
import { ImageController } from "./image.controller";
import LogSession from "../_utils/_logSession";

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
    private session: ClientSession | null = null;
    private log?: LogSession;
    private patchController: PatchController;
    private targetPath: ITargetPath = "Track";

    constructor(session: ClientSession | null, options?: { log?: LogSession, user?: IUser }) {
        super(options?.user);
        this.session = session;
        this.log = options?.log;
        this.patchController = new PatchController(this.session, { log: this.log, user: options?.user });
    }


    parse(Track: Partial<ITrack>) {
        delete Track._id;

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
        const res = await TrackModel.findOne({ id }).cache("60m");
        return this.warpper(res);
    }

    async filter(pageFilter: z.infer<typeof TrackPaginationBody>) {
        const pagination = new PaginationControllers(TrackModel);

        pagination.useFilter(pageFilter);

        const res = await pagination.getResults();

        return res;
    }
    async build(input: ICreate_Track_ZOD, params: { refId: string, isRequest: boolean, trackId?: string }) {
        const { artists, cover, ...rawTrack } = input;
        const track: Partial<ITrack> & { id: string } = {
            ...rawTrack,
            id: params.trackId || genPublicID(8)
        };
        const user = this.user;
        this.needUser(user);
        const session = this.session;
        const { refId, isRequest } = params;

        if (cover && (cover.id || cover.newImage)) {
            const imageController = new ImageController(session, { log: this.log, user });
            const getImage = cover.id ? await imageController.getById(cover.id) :
                isRequest ?
                    await imageController.create_request(cover.newImage!, { refId, target: { id: track.id }, targetPath: "Track" }) :
                    await imageController.create(cover.newImage!, { refId, target: { id: track.id }, targetPath: "Track" })
            track.cover = { id: getImage.id };
        }

        if (artists && artists.length > 0) {
            const personController = new PersonController(session, { log: this.log, user });
            const getActors = await Promise.all(
                artists.map(async (person) => {
                    if (person && (person.id || person.newPerson)) {
                        const getPerson = person.id ? await personController.getById(person.id) :
                            isRequest ?
                                await personController.create_request(person.newPerson!, { refId }) :
                                await personController.create(person.newPerson!, { refId })
                        return { id: getPerson.id };
                    }
                }))
            track.artists = getActors.filter((person) => person) as { id: string }[];
        }

        return new TrackModel(track);
    }

    public async create(data: ICreate_Track_ZOD, params: TrackParams) {
        this.needUser(this.user);
        this.needRoles(["TRACK_ADD"], this.user.roles, false);
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

        return this.warpper(res);
    }


    public async update(id: string, data: ICreate_Track_ZOD, params: Omit<TrackParams, "refId">) {
        this.needUser(this.user);
        this.needRoles(["TRACK_PATCH"], this.user.roles, false);
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

        return this.warpper(res);
    }

    public async delete(id: string, params: IMediaDeleteBody) {
        this.needUser(this.user);
        this.needRoles(["TRACK_DELETE"], this.user.roles);
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
            return true;
        }
        return false;
    }

    public async verify(id: string) {
        this.needUser(this.user);
        this.needRoles(["TRACK_VERIFY"], this.user.roles);
        const media = await this.getById(id);
        media.isVerified = true;
        await media.save({ session: this.session });
        return this.warpper(media);
    }

    public async unverify(id: string) {
        this.needUser(this.user);
        this.needRoles(["TRACK_VERIFY"], this.user.roles);
        const media = await this.getById(id);
        media.isVerified = false;
        await media.save({ session: this.session });
        return this.warpper(media);
    }

    public async create_request(data: ICreate_Track_ZOD, params: TrackParams) {
        this.needUser(this.user);
        this.needRoles(["TRACK_ADD_REQUEST"], this.user.roles);
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

        return this.warpper(res);
    }

    public async update_request(id: string, data: ICreate_Track_ZOD, params: TrackParams) {
        this.needUser(this.user);
        this.needRoles(["TRACK_PATCH_REQUEST"], this.user.roles);
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

        return this.warpper(res);
    }
}

export { TrackController };