
import { ClientSession, Document, Schema } from "mongoose";
import { APIError } from "../_lib/Error";
import { IAdd_Image_ZOD, ICreate_Image_ZOD, ImagePaginationBody, IMediaDeleteBody } from "@actunime/validations";
import { IImage, ITargetPath, IUser } from "@actunime/types";
import { UtilControllers } from "../_utils/_controllers";
import { z } from "zod";
import { PaginationControllers } from "./pagination.controllers";
import DeepDiff from 'deep-diff';
import { DevLog } from "../_lib/logger";
import { genPublicID } from "@actunime/utils";
import { Checker } from "../_utils/_checker";
import LogSession from "../_utils/_logSession";
import { PatchController } from "./patch.controllers";
import { ImageModel } from "../_lib/models";
import { CreateImageCDN, DeleteImageCDN } from "../_lib/image";

type IImageDoc = (Document<unknown, unknown, IImage> & IImage & Required<{
    _id: Schema.Types.ObjectId;
}> & {
    __v: number;
}) | null;

interface IImageResponse extends IImage {
    parsedImage: () => Partial<IImage> | null
}

type IImageControlled = IImageDoc & IImageResponse

interface ImageParams {
    refId?: string,
    description?: string
    target: { id: string }
    targetPath: ITargetPath
}

interface ImageFile {
    id: string;
    path: ITargetPath;
    value: string;
    valueIsUrl: boolean;
    IMAGE_LOCAL_HOST?: string;
    IMAGE_PORT?: string;
}

class ImageController extends UtilControllers.withUser {
    static saveImages: {
        data: ImageFile,
        session_id: ClientSession["id"]
    }[] = [];
    static deleteImages: { id: string, path: ITargetPath, session_id: ClientSession["id"] }[] = [];
    private targetPath: ITargetPath = "Image";
    private patchController: PatchController;

    constructor(session: ClientSession | null, options?: { log?: LogSession, user?: IUser }) {
        super({ session, ...options });
        this.patchController = new PatchController(session, options);
    }


    parse(Image: Partial<IImage>) {
        // delete Image._id;

        return Image;
    }

    warpper(data: IImageDoc): IImageControlled {
        if (!data)
            throw new APIError("Aucune image n'a été trouvé", "NOT_FOUND");

        const res = data as IImageControlled;
        res.parsedImage = this.parse.bind(this, data)

        return res;
    }


    async getById(id: string) {
        DevLog(`Récupération de l'image ID: ${id}`, "debug");
        const promise = ImageModel.findOne({ id });
        if (this.session) promise.session(this.session); else promise.cache("60m");
        const res = await promise;
        DevLog(`Image ${res ? "trouvée" : "non trouvée"}, ID Image: ${id}`, "debug");
        return this.warpper(res);
    }

    async filter(pageFilter: z.infer<typeof ImagePaginationBody>) {
        DevLog("Filtrage des images...", "debug");
        const pagination = new PaginationControllers(ImageModel);

        pagination.useFilter(pageFilter);

        const res = await pagination.getResults();

        DevLog(`Images trouvées: ${res.resultsCount}`, "debug");
        return res;
    }

    async build(input: ICreate_Image_ZOD, params: ImageParams) {
        const { value, ...rawImage } = input;
        const image: Partial<IImage> = { ...rawImage, target: params.target, targetPath: params.targetPath };
        DevLog(`Build Image...`);
        return new ImageModel(image);
    }


    public async create(data: ICreate_Image_ZOD, params: ImageParams) {
        DevLog("Création d'une image...", "debug");
        this.needUser(this.user);
        const patchID = genPublicID(8);
        const res = await this.build(data, params);
        res.isVerified = true;

        ImageController.saveImages.push({
            data: {
                id: res.id,
                path: params.targetPath,
                value: data.value,
                valueIsUrl: Checker.textHasLink(data.value) || false,
                IMAGE_LOCAL_HOST: process.env.IMAGE_LOCAL_HOST,
                IMAGE_PORT: process.env.IMAGE_PORT
            },
            session_id: this.session?.id
        })

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

        this.log?.add("Création d'une image", [
            { name: "CibleID", content: res.target.id },
            { name: "CibleType", content: res.targetPath },
            { name: "Label", content: res.label },
            { name: "ID", content: res.id },
            { name: "MajID", content: patchID },
            { name: "Description", content: params.description },
            { name: "Modérateur", content: `${this.user.username} (${this.user.id})` }
        ])

        DevLog(`Image crée, ID Image: ${res.id}`, "debug");
        return this.warpper(res);
    }

    public async update(id: string, data: ICreate_Image_ZOD, params: ImageParams) {
        DevLog("Modification d'une image...", "debug");
        this.needUser(this.user);
        const media = await this.getById(id);

        ImageController.saveImages.push({
            data: {
                id: media.id,
                path: params.targetPath,
                value: data.value,
                valueIsUrl: Checker.textHasLink(data.value) || false,
                IMAGE_LOCAL_HOST: process.env.IMAGE_LOCAL_HOST,
                IMAGE_PORT: process.env.IMAGE_PORT
            },
            session_id: this.session?.id
        })

        const patchID = genPublicID(8);
        const res = await this.build(data, params);
        res.id = media.id;
        res._id = media._id;

        await this.patchController.create({
            id: patchID,
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

        this.log?.add("Modification d'une image", [
            { name: "CibleID", content: res.target.id },
            { name: "CibleType", content: res.targetPath },
            { name: "Label", content: res.label },
            { name: "ID", content: res.id },
            { name: "MajID", content: patchID },
            { name: "Description", content: params.description },
            { name: "Modérateur", content: `${this.user.username} (${this.user.id})` }
        ])

        DevLog(`Image modifiée, ID Image: ${res.id}`, "debug");
        return this.warpper(res);
    }


    public async delete(id: string, params: IMediaDeleteBody) {
        DevLog("Suppression d'une image...", "debug");
        this.needUser(this.user);
        const media = await this.getById(id);
        const deleted = await media.deleteOne().session(this.session);
        ImageController.deleteImages.push({ id: media.id, path: this.targetPath, session_id: this.session?.id });
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

            this.log?.add("Suppresion d'une image", [
                { name: "CibleID", content: media.target.id },
                { name: "CibleType", content: media.targetPath },
                { name: "Label", content: media.label },
                { name: "ID", content: media.id },
                { name: "MajID", content: refId },
                { name: "Raison", content: params.reason },
                { name: "Modérateur", content: `${this.user.username} (${this.user.id})` }
            ])

            DevLog(`Image supprimée, ID Image: ${media.id}, ID Maj: ${refId}`, "debug");
            return true;
        }

        DevLog(`Image non supprimée, ID Image: ${media.id}`, "debug");
        return false;
    }

    public async verify(id: string) {
        DevLog("Verification de l'image...", "debug");
        this.needUser(this.user);
        const media = await this.getById(id);
        media.isVerified = true;
        await media.save({ session: this.session });
        DevLog(`Image verifiée, ID Image: ${media.id}`, "debug");
        return this.warpper(media);
    }

    public async unverify(id: string) {
        DevLog("Verification de l'image...", "debug");
        this.needUser(this.user);
        const media = await this.getById(id);
        media.isVerified = false;
        await media.save({ session: this.session });
        DevLog(`Image non verifiée, ID Image: ${media.id}`, "debug");
        return this.warpper(media);
    }

    async createImageFile(data: ImageFile) {
        DevLog("Creation du fichier de l'image...", "debug");
        await CreateImageCDN(data);
        DevLog(`Fichier de l'image crée, ID Image: ${data.id}`, "debug");
    }

    async deleteImageFile(id: string, path: ITargetPath) {
        DevLog("Suppression du fichier de l'image...", "debug");
        await DeleteImageCDN({ id, path });
        DevLog(`Fichier de l'image supprimée, ID Image: ${id}`, "debug");
    }

    public async create_request(data: ICreate_Image_ZOD, params: ImageParams) {
        DevLog("Creation de la demande de l'image...", "debug");
        this.needUser(this.user);
        const patchID = genPublicID(8);
        const res = await this.build(data, params);
        res.isVerified = false;

        ImageController.saveImages.push({
            data: {
                id: res.id,
                path: params.targetPath,
                value: data.value,
                valueIsUrl: Checker.textHasLink(data.value) || false,
                IMAGE_LOCAL_HOST: process.env.IMAGE_LOCAL_HOST,
                IMAGE_PORT: process.env.IMAGE_PORT
            },
            session_id: this.session?.id
        })

        await this.patchController.create({
            id: patchID,
            ...params.refId && { ref: { id: params.refId } },
            type: "CREATE",
            author: { id: this.user.id },
            target: { id: res.id },
            targetPath: "Image",
            original: res.toJSON(),
            status: "PENDING",
            description: params.description
        });

        await res.save({ session: this.session });

        this.log?.add("Demande de création d'une image", [
            { name: "CibleID", content: res.target.id },
            { name: "CibleType", content: res.targetPath },
            { name: "Label", content: res.label },
            { name: "ID", content: res.id },
            { name: "MajID", content: patchID },
            { name: "Description", content: params.description },
            { name: "Modérateur", content: `${this.user.username} (${this.user.id})` }
        ])

        DevLog(`Image crée, Demande crée... ID Image: ${res.id}, ID Demande: ${patchID}`, "debug");
        return this.warpper(res);
    }

    public async update_request(id: string, data: ICreate_Image_ZOD, params: ImageParams) {
        DevLog("Création demande de modification de l'image...", "debug");
        this.needUser(this.user);
        const media = await this.getById(id);
        const patchID = genPublicID(8);
        const res = await this.build(data, params);
        res.id = media.id;
        res._id = media._id;

        await this.patchController.create({
            id: patchID,
            type: "UPDATE",
            author: { id: this.user.id },
            target: { id: res.id },
            targetPath: "Image",
            original: media.toJSON(),
            // Sauvegarde de la value dans les modifications
            changes: DeepDiff.diff(media, { ...res, value: data.value }, {
                prefilter: (_, key) => (["__v", "_id", "id"].includes(key) ? false : true)
            }),
            status: "PENDING",
            description: params.description
        });

        this.log?.add("Demande de modification d'une image", [
            { name: "CibleID", content: res.target.id },
            { name: "CibleType", content: res.targetPath },
            { name: "Label", content: res.label },
            { name: "ID", content: res.id },
            { name: "MajID", content: patchID },
            { name: "Description", content: params.description },
            { name: "Modérateur", content: `${this.user.username} (${this.user.id})` }
        ])

        DevLog(`Demande crée... ID Image: ${res.id}, ID Demande: ${patchID}`, "debug");
        return this.warpper(res);
    }

}

export { ImageController }