import { ImageModel } from "@actunime/mongoose-models";
import { ClientSession, Document, Schema } from "mongoose";
import { APIError } from "../_lib/Error";
import { IAdd_Image_ZOD, ICreate_Image_ZOD, ImagePaginationBody } from "@actunime/validations";
import { CreateImageCDN, DeleteImageCDN, IImage, IPatchType, ITargetPath, IUser } from "@actunime/types";
import { UtilControllers } from "../_utils/_controllers";
import { z } from "zod";
import { PaginationControllers } from "./pagination.controllers";
import { PatchControllers } from "./patch";
import DeepDiff from 'deep-diff';
import { genPublicID } from "@actunime/utils";
import { Checker } from "../_utils/_checker";

type IImageDoc = (Document<unknown, unknown, IImage> & IImage & Required<{
    _id: Schema.Types.ObjectId;
}> & {
    __v: number;
}) | null;

interface IImageResponse extends IImage {
    parsedImage: () => Partial<IImage> | null
}

type IImageControlled = IImageDoc & IImageResponse

interface ImagePatchParams {
    useMediaId?: string
    mediaId?: string;
    refId: string,
    pathId?: string,
    description?: string,
    type: IPatchType,
    targetPath: ITargetPath
}


class ImageController extends UtilControllers.withUser {
    static savedImages: Partial<IImage>[] = [];
    private session: ClientSession | null = null;

    constructor(session: ClientSession | null, user?: IUser) {
        super(user);
        this.session = session;
    }

    parse(Image: Partial<IImage>) {
        delete Image._id;

        return Image;
    }

    warpper(data: IImageDoc): IImageControlled {
        if (!data)
            throw new APIError("Aucun utilisateur n'a été trouvé", "NOT_FOUND");

        const res = data as IImageControlled;
        res.parsedImage = this.parse.bind(this, data)

        return res;
    }


    async getById(id: string) {
        const res = await ImageModel.findOne({ id }).cache("60m");
        return this.warpper(res);
    }

    async createImage(
        data: ICreate_Image_ZOD,
        options: {
            target: string,
            targetPath: ITargetPath,
            valueIsUrl?: boolean
        }
    ) {
        const { value, label } = data;
        const { target, targetPath, valueIsUrl } = options;
        const newImage = new ImageModel({ label, target, targetPath });

        await CreateImageCDN({
            id: newImage.id,
            path: targetPath,
            value,
            valueIsUrl: valueIsUrl || false,
            IMAGE_LOCAL_HOST: process.env.IMAGE_LOCAL_HOST,
            IMAGE_PORT: process.env.IMAGE_PORT
        })

        await newImage.save({ session: this.session });

        return newImage;
    }

    async deleteImage(id: string, path: ITargetPath) {
        await DeleteImageCDN({ id, path });
        await ImageModel.findOneAndDelete({ id })
            .session(this.session);
    }

    async filter(pageFilter: z.infer<typeof ImagePaginationBody>, options?: { onlyVerified: boolean }) {
        const pagination = new PaginationControllers(ImageModel);

        pagination.useFilter(pageFilter, options?.onlyVerified);

        const res = await pagination.getResults();

        return res;
    }

    // Création d'un image
    private async create(data: Partial<IImage>) {
        this.needUser(this.user);

        const res = new ImageModel(data);
        await res.save({ session: this.session });
        return this.warpper(res);
    }

    // Création avec patch (public)
    public async create_patch(data: Partial<IImage>, params: ImagePatchParams) {
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
            targetPath: "Image",
            status: isModerator ? "ACCEPTED" : "PENDING",
            original: res.toJSON(),
            changes,
            description: params.description,
            ref: params.refId ? { id: params.refId } : undefined,
            moderator: isModerator ? { id: this.user.id } : undefined
        });
        return res;
    }


    async parseZOD(input: Partial<ICreate_Image_ZOD>, params: ImagePatchParams) {

        const { value, ...rawInput } = input;
        if (!params.useMediaId)
            throw new APIError("Le useMediaId est obligatoire", "BAD_ENTRY");

        const image: Partial<IImage> = {
            id: params.useMediaId,
            target: { id: params.useMediaId },
            targetPath: params?.targetPath,
            ...rawInput
        };
        
        if (!value)
            throw new APIError("Le value de l'image est obligatoire", "BAD_ENTRY");

        await CreateImageCDN({
            id: params.useMediaId,
            path: params?.targetPath,
            value,
            valueIsUrl: Checker.textHasLink(value),
            IMAGE_LOCAL_HOST: process.env.IMAGE_LOCAL_HOST,
            IMAGE_PORT: process.env.IMAGE_PORT
        })

        ImageController.savedImages.push(image);

        return image;
    }


    async create_relation(image: IAdd_Image_ZOD, params: ImagePatchParams) {
        if (!image.id && !image.newImage)
            throw new APIError("Le image est obligatoire", "BAD_ENTRY");
        if (image.id && image.newImage)
            throw new APIError("Faites un choix... vous ne pouvez pas assigner un nouveau image et un existant", "BAD_ENTRY");

        if (image.newImage) {
            const imageId = genPublicID(5);
            const newImage = await this.parseZOD(image.newImage, { ...params, useMediaId: imageId });
            const res = await this.create_patch(newImage, { ...params, useMediaId: imageId }); // forcé le patch a prendre la ref comme id, comme ça les médias attachées seront bien lié;
            return { id: res.id };
        }

        const res = await this.getById(image.id!);
        return { id: res.id };
    }

}

export { ImageController }