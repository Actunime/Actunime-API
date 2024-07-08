import { ImageModel } from "@/_models/_imageModel";
import { IImage } from "@/_types/imageType";
import { IPaginationResponse } from "@/_types/paginationType";
import { IPatchActionList } from "@/_types/patchType";
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

const ImagePathRoot = process.env.NODE_ENV === 'production' ? '/actunime/img' : path.join(__dirname, '..', '..', 'img');

export class ImageManager {
    private session: ClientSession;
    private user?: IUser;
    private newData!: Partial<IImage>;
    private imageValue!: string;
    private targetPath!: ITargetPath;

    constructor(session: ClientSession, targetPath: ITargetPath, user?: IUser) {
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

        if (paginationInput.strict) {
            pagination.setStrict(paginationInput.strict);
        }

        if (sort) pagination.setSort(sort);

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
        const fullRootPath = ImagePathRoot + '/' + this.targetPath.toLocaleLowerCase();

        if (!fs.existsSync(fullRootPath)) {
            fs.mkdirSync(fullRootPath, { recursive: true });
        }

        const sharp = Sharp(Buffer.from(value.replace(/^data:image\/webp;base64,/, ''), 'base64'));

        await sharp
            .toFormat('webp')
            .webp({ quality: 80, lossless: true, alphaQuality: 80, force: false })
            .toFile(fullRootPath + '/' + id + '.webp');
    }

    private async deleteImageFile(id: string) {
        const fullRootPath = ImagePathRoot + '/' + this.targetPath.toLocaleLowerCase();
        fs.unlinkSync(fullRootPath + '/' + id + '.webp');
    }

    public async create(note?: string) {
        const newImage = new ImageModel(this.newData);
        newImage.isVerified = true;
        await newImage.save({ session: this.session });
        await this.createImageFile(newImage.id, this.imageValue);

        const actions: IPatchActionList[] = [{ note, label: 'DIRECT_CREATE', user: this.user! }];

        await new PatchManager(this.session, this.user!).PatchCreate({
            type: 'CREATE',
            status: 'ACCEPTED',
            target: { id: newImage.id },
            actions,
            targetPath: 'Image',
            changes: newImage.toJSON(),
            beforeChanges: null,
            author: { id: this.user!.id }
        });

        return newImage;
    }

    public async createRequest(note?: string) {
        const newImage = new ImageModel(this.newData);

        // Pré-disposition d'un image qui est en cours de création.
        await newImage.save({ session: this.session });
        await this.createImageFile(newImage.id, this.imageValue);

        const actions: IPatchActionList[] = [{ note, label: 'REQUEST', user: this.user! }];

        await new PatchManager(this.session, this.user!).PatchCreate({
            type: 'CREATE_REQUEST',
            status: 'PENDING',
            target: { id: newImage.id },
            actions,
            targetPath: 'Image',
            changes: newImage.toJSON(),
            beforeChanges: null,
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

        if (!imageToUpdate) throw new Error('Image not found');

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

        // if (!changes) throw new Error('No changes found');

        // await imageToUpdate.updateOne({ $set: changes.newValues }, { session: this.session });

        const actions: IPatchActionList[] = [{ note, label: 'DIRECT_PATCH', user: this.user! }];

        await new PatchManager(this.session, this.user!).PatchCreate({
            type: 'UPDATE',
            status: 'ACCEPTED',
            target: { id: newImageData.id },
            actions,
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

        if (!changes) throw new Error('No changes found');

        await imageToUpdate.updateOne({ $set: changes.newValues }, { session: this.session });

        const actions: IPatchActionList[] = [{ note, label: 'REQUEST', user: this.user! }];

        await new PatchManager(this.session, this.user!).PatchCreate({
            type: 'UPDATE_REQUEST',
            status: 'PENDING',
            target: { id: newImageData.id },
            actions,
            targetPath: 'Image',
            changes: changes?.newValues,
            beforeChanges: changes?.oldValues,
            author: { id: this.user!.id }
        });

        return newImageData;
    }

    public async createRelation(relation: IAdd_Image_ZOD) {
        if (relation.newImage) {
            const newImage = await this.init(relation.newImage).create();
            return { id: newImage.id };
        } else if (relation.id && (await ImageModel.exists({ id: relation.id }))) {
            return { id: relation.id };
        } else {
            throw new Error('Image invalide');
        }
    }

    public async createMultipleRelation(
        relations: IAdd_Image_ZOD[]
    ) {
        const relList: { id: string }[] = [];
        for await (const relation of relations) {
            const rel = await this.createRelation(relation);
            relList.push(rel);
        }
        return relList;
    }
}