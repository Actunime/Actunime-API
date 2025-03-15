import { ImageModel } from "@actunime/mongoose-models";
import { ClientSession, Document, Schema } from "mongoose";
import { APIError } from "../_lib/Error";
import { IAdd_Image_ZOD, ICreate_Image_ZOD, ImagePaginationBody, IMediaDeleteBody } from "@actunime/validations";
import { CreateImageCDN, DeleteImageCDN, IImage, IPatchType, ITargetPath, IUser, PatchTypeObj } from "@actunime/types";
import { UtilControllers } from "../_utils/_controllers";
import { z } from "zod";
import { PaginationControllers } from "./pagination.controllers";
import { PatchController } from "./patch.controllers";
import DeepDiff from 'deep-diff';
import { genPublicID } from "@actunime/utils";
import { Checker } from "../_utils/_checker";
import LogSession from "../_utils/_logSession";

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
    private session: ClientSession | null = null
    private log?: LogSession;
    private patchController: PatchController
    private targetPath: ITargetPath = "Image";

    constructor(session: ClientSession | null, options?: { log?: LogSession, user?: IUser }) {
        super(options?.user);
        this.session = session;
        this.log = options?.log;
        this.patchController = new PatchController(this.session, { log: this.log, user: options?.user });
    }


    parse(Image: Partial<IImage>) {
        delete Image._id;

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
        const res = await ImageModel.findOne({ id }).cache("60m");
        return this.warpper(res);
    }

    async filter(pageFilter: z.infer<typeof ImagePaginationBody>) {
        const pagination = new PaginationControllers(ImageModel);

        pagination.useFilter(pageFilter);

        const res = await pagination.getResults();

        return res;
    }

    async build(input: ICreate_Image_ZOD, params: ImageParams) {
        const { value, ...rawImage } = input;
        const image: Partial<IImage> = { ...rawImage, target: params.target, targetPath: params.targetPath };

        return new ImageModel(image);
    }


    public async create(data: ICreate_Image_ZOD, params: ImageParams) {
        this.needUser(this.user);
        this.needRoles(["IMAGE_ADD"], this.user.roles, false);
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

        return this.warpper(res);
    }

    public async update(id: string, data: ICreate_Image_ZOD, params: ImageParams) {
        this.needUser(this.user);
        this.needRoles(["IMAGE_PATCH"], this.user.roles, false);
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

        return this.warpper(res);
    }


    public async delete(id: string, params: IMediaDeleteBody) {
        this.needUser(this.user);
        this.needRoles(["IMAGE_DELETE"], this.user.roles);
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
            return true;
        }
        return false;
    }

    public async verify(id: string) {
        this.needUser(this.user);
        this.needRoles(["IMAGE_VERIFY"], this.user.roles);
        const media = await this.getById(id);
        media.isVerified = true;
        await media.save({ session: this.session });
        return this.warpper(media);
    }

    public async unverify(id: string) {
        this.needUser(this.user);
        this.needRoles(["IMAGE_VERIFY"], this.user.roles);
        const media = await this.getById(id);
        media.isVerified = false;
        await media.save({ session: this.session });
        return this.warpper(media);
    }

    async createImageFile(data: ImageFile) {
        await CreateImageCDN(data);
    }

    async deleteImageFile(id: string, path: ITargetPath) {
        await DeleteImageCDN({ id, path });
    }

    public async create_request(data: ICreate_Image_ZOD, params: ImageParams) {
        this.needUser(this.user);
        this.needRoles(["IMAGE_ADD_REQUEST"], this.user.roles);
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

        return this.warpper(res);
    }

    public async update_request(id: string, data: ICreate_Image_ZOD, params: ImageParams) {
        this.needUser(this.user);
        this.needRoles(["IMAGE_PATCH_REQUEST"], this.user.roles);
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

        return this.warpper(res);
    }

}

export { ImageController }