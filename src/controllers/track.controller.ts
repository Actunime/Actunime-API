import { TrackModel } from "@actunime/mongoose-models";
import { ClientSession, Document, Schema } from "mongoose";
import { APIError } from "../_lib/Error";
import { ITrack, IPatchType, IUser } from "@actunime/types";
import { PaginationControllers } from "./pagination.controllers";
import { z } from "zod";
import { TrackPaginationBody, IAdd_Track_ZOD, ICreate_Track_ZOD } from "@actunime/validations";
import { UtilControllers } from "../_utils/_controllers";
import { PatchControllers } from "./patch";
import DeepDiff from 'deep-diff';
import { genPublicID } from "@actunime/utils";
import { PersonController } from "./person.controler";
import { ImageController } from "./image.controllers";

type ITrackDoc = (Document<unknown, unknown, ITrack> & ITrack & Required<{
    _id: Schema.Types.ObjectId;
}> & {
    __v: number;
}) | null

interface ITrackResponse extends ITrack {
    parsedTrack: () => Partial<ITrack> | null
}

type ITrackControlled = ITrackDoc & ITrackResponse

interface TrackPatchParams {
    useMediaId?: string;
    mediaId?: string;
    refId: string,
    pathId?: string,
    description?: string,
    type: IPatchType
}

class TrackController extends UtilControllers.withUser {
    private session: ClientSession | null = null;

    constructor(session: ClientSession | null, user?: IUser) {
        super(user);
        this.session = session;
    }

    parse(Track: Partial<ITrack>) {
        delete Track._id;

        return Track;
    }

    warpper(data: ITrackDoc): ITrackControlled {
        if (!data)
            throw new APIError("Aucun utilisateur n'a été trouvé", "NOT_FOUND");

        const res = data as ITrackControlled;
        res.parsedTrack = this.parse.bind(this, data)

        return res;
    }

    async getById(id: string) {
        const res = await TrackModel.findOne({ id }).cache("60m");
        return this.warpper(res);
    }

    async filter(pageFilter: z.infer<typeof TrackPaginationBody>, options?: { onlyVerified: boolean }) {
        const pagination = new PaginationControllers(TrackModel);

        pagination.useFilter(pageFilter, options?.onlyVerified);

        const res = await pagination.getResults();

        return res;
    }

    // Création d'un track
    private async create(data: Partial<ITrack>, useMediaId?: string) {
        this.needUser(this.user);

        const res = new TrackModel(data);
        if (useMediaId) res.id = useMediaId;
        await res.save({ session: this.session });
        return this.warpper(res);
    }

    // Création avec patch (public)
    public async create_patch(data: Partial<ITrack>, params: TrackPatchParams) {
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
            id: params.pathId ? params.pathId : undefined,
            type: params.type,
            author: { id: this.user.id },
            target: { id: res.id },
            targetPath: "Track",
            status: isModerator ? "ACCEPTED" : "PENDING",
            original: res.toJSON(),
            changes,
            description: params.description,
            ref: params.refId ? { id: params.refId } : undefined,
            moderator: isModerator ? { id: this.user.id } : undefined
        });
        return res;
    }

    async parseZOD(input: Partial<ICreate_Track_ZOD>, params: TrackPatchParams) {
        this.needUser(this.user);
        // Médias attachées
        const { cover, artists, ...rawInput } = input;
        const track: Partial<ITrack> = { ...rawInput };

        if (cover) {
            const controller = new ImageController(this.session, this.user);
            if (!params.mediaId)
                throw new APIError("Le useMediaId est obligatoire", "BAD_ENTRY");

            const res = await controller.create_relation(cover, {
                type: params.type,
                refId: params.refId,
                targetPath: "Track"
            });

            track.cover = { id: res.id };
        }

        if (artists && artists.length) {
            const controller = new PersonController(this.session, this.user);
            track.artists = []
            for (const artist of artists) {
                const res = await controller.create_relation(artist, params);
                track.artists.push({ id: res.id });
            }
        }

        return track;
    }


    async create_relation(track: IAdd_Track_ZOD, params: TrackPatchParams) {
        if (!track.id && !track.newTrack)
            throw new APIError("Le track est obligatoire", "BAD_ENTRY");
        if (track.id && track.newTrack)
            throw new APIError("Faites un choix... vous ne pouvez pas assigner un nouveau track et un existant", "BAD_ENTRY");

        if (track.newTrack) {
            const trackId = genPublicID(5);
            const refId = genPublicID(8); // Création d'une référence pour les medias attachées
            const newTrack = await this.parseZOD(track.newTrack, { ...params, refId, useMediaId: trackId });
            const res = await this.create_patch(newTrack, { ...params, pathId: refId, useMediaId: trackId }); // forcé le patch a prendre la ref comme id, comme ça les médias attachées seront bien lié;
            return { id: res.id };
        }

        const res = await this.getById(track.id!);
        return { id: res.id };
    }

    private async delete(id: string) {
        const res = await TrackModel.findOneAndDelete({ id }, { session: this.session });
        return this.warpper(res);
    }

    private async update(id: string, data: Partial<ITrack>) {
        const res = await TrackModel.findOneAndUpdate({ id }, data, { session: this.session });
        return this.warpper(res);
    }
}

export { TrackController };