import { ImageModel } from "@/_models/_imageModel";
import { IImage } from "@/_types/imageType";
import { IPaginationResponse } from "@/_types/paginationType";
import { IUser } from "@/_types/userType";
import { getChangedData } from "@/_utils/getObjChangeUtil";
import { IImage_Pagination_ZOD, ICreate_Image_ZOD, IAdd_Image_ZOD } from "@/_validation/imageZOD";
import { ClientSession, Document } from "mongoose";
import { MediaPagination } from "./pagination";
import { PatchManager } from "./patch";
import Sharp from "sharp";
import fs from 'fs';
import { ITargetPath } from "@/_utils/global";
import path from "path";
import { IImageLabel } from "@/_utils/imageUtil";
import { APIError } from "./Error";

const ImagePathRoot = process.env.NODE_ENV === 'production' ? '/actunime/img' : path.join(__dirname, '..', '..', 'img');

export class ImageManager {
    private session: ClientSession;
    private user?: IUser;
    private newData!: Partial<IImage>;
    private imageValue!: string;
    private targetPath?: ITargetPath;

    constructor(session: ClientSession, targetPath?: ITargetPath, user?: IUser) {
        this.user = user;
        this.session = session;
        this.targetPath = targetPath;
    }

    private async populate(
        doc: Document | IPaginationResponse<IImage>,
        withMedia: IImage_Pagination_ZOD['with']
    ) { }

    public async get(id: string, withMedia?: IImage_Pagination_ZOD['with']) {
        const findImage = await ImageModel.findOne({ id }, null, { session: this.session }).select(
            '-_id'
        );

        if (!findImage) throw new Error('Image not found');

        if (withMedia) await this.populate(findImage, withMedia);

        return findImage.toJSON();
    }

    public async filter(paginationInput: IImage_Pagination_ZOD) {
        const pagination = new MediaPagination({ model: ImageModel });

        pagination.setPagination({ page: paginationInput.page, limit: paginationInput.limit });

        // const query = paginationInput.query;
        const sort = paginationInput.sort;

        if (paginationInput.query) {
            if (paginationInput.query?.ids?.length)
                pagination.getByIds(paginationInput.query.ids as string[]);
        }

        if (paginationInput.strict)
            pagination.setStrict(paginationInput.strict);

        if (sort)
            pagination.setSort(sort);

        const response = await pagination.getResults();

        if (paginationInput.with) await this.populate(response, paginationInput.with);

        return response;
    }

    public init(data: Partial<ICreate_Image_ZOD>) {
        const { value, ...rawData } = data;

        this.newData = rawData as Partial<IImage>;

        if (!value)
            throw new Error('image value is required');

        this.imageValue = value;

        return this;
    }

    private async createImageFile(id: string, value: string) {
        console.log("Création de l'image...")
        const fullRootPath = ImagePathRoot + '/' + this.targetPath?.toLocaleLowerCase();

        if (!fs.existsSync(fullRootPath)) {
            fs.mkdirSync(fullRootPath, { recursive: true });
        }

        const sharp = Sharp(Buffer.from(value.replace(/^data:image\/webp;base64,/, ''), 'base64'));

        await sharp
            .toFormat('webp')
            .webp({ quality: 80, lossless: true, alphaQuality: 80, force: false })
            .toFile(fullRootPath + '/' + id + '.webp');
    }

    public async deleteImageFile(id: string) {
        try {
            const fullRootPath = ImagePathRoot + '/' + this.targetPath?.toLocaleLowerCase();
            fs.unlinkSync(fullRootPath + '/' + id + '.webp');
        } catch (err) {
            console.error(err);
        }
    }
    static async deleteImageFileIfExist(id?: string, targetPath?: ITargetPath) {
        if (!id || !targetPath) return;
        try {
            const fullRootPath = ImagePathRoot + '/' + targetPath.toLocaleLowerCase();
            fs.unlinkSync(fullRootPath + '/' + id + '.webp');
        } catch (err) {
            console.error(err);
        }
    }

    public async create(note?: string) {
        const newImage = new ImageModel({
            targetPath: this.targetPath
        });
        try {
            newImage.isVerified = true;
            await newImage.save({ session: this.session });
            await this.createImageFile(newImage.id, this.imageValue);

            await new PatchManager(this.session, this.user!).PatchCreate({
                type: 'CREATE',
                status: 'ACCEPTED',
                target: { id: newImage.id },
                note,
                targetPath: 'Image',
                newValues: newImage.toJSON(),
                oldValues: null,
                author: { id: this.user!.id }
            });

            return newImage;
        } catch (err) {
            this.deleteImageFile(newImage.id).catch(() => { });
            console.error("lors de la création d'une image", err)
            throw err;
        }
    }

    public async createRequest(note?: string) {
        const newImage = new ImageModel(this.newData);

        // Pré-disposition d'un image qui est en cours de création.
        await newImage.save({ session: this.session });
        await this.createImageFile(newImage.id, this.imageValue);



        await new PatchManager(this.session, this.user!).PatchCreate({
            type: 'CREATE_REQUEST',
            status: 'PENDING',
            target: { id: newImage.id },

            targetPath: 'Image',
            newValues: newImage.toJSON(),
            oldValues: null,
            author: { id: this.user!.id }
        });

        return newImage;
    }

    public async update(imageID: string, note?: string) {
        const newImageData = new ImageModel(this.newData);

        const imageToUpdate = await ImageModel.findOne(
            { id: imageID },
            {},
            { session: this.session }
        );

        if (!imageToUpdate) throw new APIError("Aucune image n'a été trouvé", "NOT_FOUND", 404);

        newImageData._id = imageToUpdate._id;
        newImageData.id = imageToUpdate.id;

        await this.deleteImageFile(imageToUpdate.id);
        await this.createImageFile(newImageData.id, this.imageValue);

        // const changes = await getChangedData(imageToUpdate.toJSON(), newImageData, [
        //     '_id',
        //     'id',
        //     'createdAt',
        //     'updatedAt'
        // ]);

        // if (!changes) throw new APIError("Aucun changement n'a été détecté", "EMPTY_CHANGES", 400);");

        // await imageToUpdate.updateOne({ $set: changes.newValues }, { session: this.session });



        await new PatchManager(this.session, this.user!).PatchCreate({
            type: 'UPDATE',
            status: 'ACCEPTED',
            target: { id: newImageData.id },

            targetPath: 'Image',
            // changes: changes?.newValues,
            // beforeChanges: changes?.oldValues,
            author: { id: this.user!.id }
        });

        return newImageData;
    }

    public async updateRequest(imageID: string, note?: string) {
        const newImageData = new ImageModel(this.newData);

        const imageToUpdate = await ImageModel.findOne(
            { id: imageID },
            {},
            { session: this.session }
        );

        if (!imageToUpdate) throw new Error('Image not found');

        newImageData._id = imageToUpdate._id;
        newImageData.id = imageToUpdate.id;

        const changes = await getChangedData(imageToUpdate.toJSON(), newImageData, [
            '_id',
            'id',
            'createdAt',
            'updatedAt'
        ]);

        if (!changes) throw new APIError("Aucun changement n'a été détecté", "EMPTY_CHANGES", 400);

        await imageToUpdate.updateOne({ $set: changes.newValues }, { session: this.session });



        await new PatchManager(this.session, this.user!).PatchCreate({
            type: 'UPDATE_REQUEST',
            status: 'PENDING',
            target: { id: newImageData.id },

            targetPath: 'Image',
            newValues: changes?.newValues,
            oldValues: changes?.oldValues,
            author: { id: this.user!.id }
        });

        return newImageData;
    }

    public async createRelation(relation: IAdd_Image_ZOD) {
        if (relation.newImage) {
            const newImage = await this.init(relation.newImage).create();
            return { id: newImage.id, label: relation.label || relation.newImage.label };
        } else if (relation.id && (await ImageModel.exists({ id: relation.id }))) {
            return { id: relation.id, label: relation.label };
        } else {
            console.error(relation);
            throw new APIError("Le format des données de l'image sont invalides.", "BAD_ENTRY", 400);
        }
    }

    public async createMultipleRelation(
        relations: IAdd_Image_ZOD[]
    ) {
        const relList: { id: string, label?: IImageLabel }[] = [];
        for await (const relation of relations.filter(rel => rel && Object.keys(rel).length > 0)) {
            const rel = await this.createRelation(relation);
            relList.push(rel);
        }
        return relList;
    }
}