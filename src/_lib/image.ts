import { ImageModel } from "@actunime/mongoose-models";
import {
  IImage,
  IUser,
  ITargetPath,
  IPaginationResponse,
  CreateImageCDN,
  DeleteImageCDN,
  IImageLabel,
} from "@actunime/types";
import {
  IImage_Pagination_ZOD,
  ICreate_Image_ZOD,
  IAdd_Image_ZOD,
} from "@actunime/validations";
import { ClientSession, Document, Schema } from "mongoose";
import { MediaPagination } from "./pagination";
import { PatchManager } from "./patch";
import { DevLog, getChangedDataV2 } from "@actunime/utils";
import { APIError } from "./Error";

export class ImageManager {
  private session: ClientSession;
  private user?: IUser;
  private newData!: Partial<IImage>;
  public imageValue!: string;
  private targetPath?: ITargetPath;
  private newImage!: Document<unknown, object, IImage> &
    IImage &
    Required<{
      _id: Schema.Types.ObjectId;
    }>;
  private imageWasSaved: boolean = false;
  private patchManager: PatchManager;
  private isRequest?: boolean;

  public hasNewImage() {
    return (this.newImage ? true : false) && this.imageWasSaved;
  }

  public deleteImageIfSaved() {
    if (this.hasNewImage()) return this.deleteImageFile();
    return Promise.resolve();
  }

  constructor(session: ClientSession, options: { user?: IUser, isRequest?: boolean, targetPath?: ITargetPath }) {
    this.user = options.user;
    this.session = session;
    this.targetPath = options.targetPath;
    this.isRequest = options.isRequest;
    this.patchManager = new PatchManager(session, options);
  }

  private async populate(
    doc: Document | IPaginationResponse<IImage>,
    withMedia: IImage_Pagination_ZOD["with"],
  ) { }

  public async get(id: string, withMedia?: IImage_Pagination_ZOD["with"]) {
    const findImage = await ImageModel.findOne({ id }, null, {
      session: this.session,
    }).select("-_id");

    if (!findImage) throw new APIError("L'image n'a pas été trouvé !", "NOT_FOUND", 404);

    if (withMedia) await this.populate(findImage, withMedia);

    return findImage.toJSON();
  }

  public async filter(paginationInput: IImage_Pagination_ZOD) {
    const pagination = new MediaPagination({ model: ImageModel });

    pagination.setPagination({
      page: paginationInput.page,
      limit: paginationInput.limit,
    });

    const query = paginationInput.query;
    const sort = paginationInput.sort;

    if (paginationInput.query) {
      if (paginationInput.query?.ids?.length)
        pagination.getByIds(paginationInput.query.ids as string[]);
    }

    if (paginationInput.strict) pagination.setStrict(paginationInput.strict);

    if (sort) pagination.setSort(sort);

    const response = await pagination.getResults(this.user?.preferences?.displayUnverifiedMedia || query?.allowUnverified || false);

    if (paginationInput.with)
      await this.populate(response, paginationInput.with);

    return response;
  }

  public init(data: Partial<ICreate_Image_ZOD>) {
    const { value, ...rawData } = data;

    this.newData = rawData as Partial<IImage>;

    if (!value) throw new APIError("Valeur de l'image requise", "BAD_ENTRY", 400);

    this.imageValue = value;

    return this;
  }

  public async createImageFile(value: string) {
    // const fullRootPath = ImagePathRoot + '/' + this.targetPath?.toLocaleLowerCase();
    const id = this.newImage.id;
    if (!id) throw new APIError("id de l'image non renseigné", "BAD_ENTRY", 400);

    await CreateImageCDN({
      id,
      path: this.targetPath!,
      value,
      valueIsUrl: false,
      IMAGE_LOCAL_HOST: process.env.IMAGE_LOCAL_HOST,
      IMAGE_PORT: process.env.IMAGE_PORT
    });

    this.imageWasSaved = true;
  }

  private async createImageFileFromURL(value: string) {
    const id = this.newImage?.id;
    if (!id) throw new APIError("id de l'image non renseigné", "BAD_ENTRY", 400);

    // if (!fs.existsSync(fullRootPath)) {
    //   fs.mkdirSync(fullRootPath, { recursive: true });
    // }

    // const imgURLBuffer = await (await fetch(value)).arrayBuffer();

    // const sharp = Sharp(imgURLBuffer);

    // await sharp
    //   .toFormat('webp')
    //   .webp({ quality: 80, lossless: true, alphaQuality: 80, force: false })
    //   .toFile(fullRootPath + '/' + id + '.webp');

    await CreateImageCDN({
      id,
      path: this.targetPath!,
      value,
      valueIsUrl: true,
      IMAGE_LOCAL_HOST: process.env.IMAGE_LOCAL_HOST,
      IMAGE_PORT: process.env.IMAGE_PORT
    });

    this.imageWasSaved = true;
  }

  public async deleteImageFile(idbis?: string) {
    try {
      const id = idbis || this.newImage?.id;
      if (!id) throw new APIError("id de l'image non renseigné", "BAD_ENTRY", 400);
      await DeleteImageCDN({ id, path: this.targetPath! });
      await ImageModel.findOneAndDelete({ id }, { session: this.session });
    } catch (err) {
      console.error(err);
    }
  }

  static async deleteImageFileIfExist(id?: string, targetPath?: ITargetPath) {
    if (!id || !targetPath) return;
    try {
      await DeleteImageCDN({ id, path: targetPath! });
      await ImageModel.findOneAndDelete({ id });
    } catch (err) {
      console.error(err);
    }
  }

  public async create(note?: string | null, controlledSave?: boolean) {
    this.newImage = new ImageModel({
      ...this.newData,
      targetPath: this.targetPath,
    });

    try {
      this.newImage.isVerified = true;
      await this.newImage.save({ session: this.session });
      if (!controlledSave)
        await this.createImageFile(this.imageValue);

      await this.patchManager.PatchCreate({
        type: "CREATE",
        status: "ACCEPTED",
        target: { id: this.newImage.id },
        note: note || undefined,
        targetPath: "Image",
        newValues: this.newImage.toJSON(),
        oldValues: null,
        author: { id: this.user!.id },
      });

      return this.newImage;
    } catch (err) {
      this.deleteImageFile();
      console.error("lors de la création d'une image", err);
      throw err;
    }
  }

  public async createFromURL(note?: string) {
    this.newImage = new ImageModel({
      ...this.newData,
      targetPath: this.targetPath,
    });
    try {
      this.newImage.isVerified = true;
      await this.newImage.save({ session: this.session });
      await this.createImageFileFromURL(this.imageValue);

      await this.patchManager.PatchCreate({
        type: "CREATE",
        status: "ACCEPTED",
        target: { id: this.newImage.id },
        note,
        targetPath: "Image",
        newValues: this.newImage.toJSON(),
        oldValues: null,
        author: { id: this.user!.id },
      });

      return this.newImage;
    } catch (err) {
      this.deleteImageFile();
      console.error("lors de la création d'une image", err);
      throw err;
    }
  }

  public async createRequest(note?: string | null, controlledSave?: boolean) {
    DevLog("Création de la demande de l'image...", "debug");

    this.newImage = new ImageModel({
      ...this.newData,
      targetPath: this.targetPath,
      isVerified: false
    });

    // Pré-disposition d'un image qui est en cours de création.
    await this.newImage.save({ session: this.session });

    if (!controlledSave)
      await this.createImageFile(this.imageValue);

    await this.patchManager.PatchCreate({
      type: "CREATE_REQUEST",
      status: "PENDING",
      target: { id: this.newImage.id },
      note: note || undefined,
      targetPath: "Image",
      newValues: this.newImage.toJSON(),
      oldValues: null,
      author: { id: this.user!.id },
    });

    return this.newImage;
  }

  public async patch(imageID: string, note?: string) {
    const newImageData = new ImageModel({
      ...this.newData,
      targetPath: this.targetPath
    });

    const imageToUpdate = await ImageModel.findOne(
      { id: imageID },
      {},
      { session: this.session },
    );

    if (!imageToUpdate)
      throw new APIError("Aucune image n'a été trouvé", "NOT_FOUND", 404);

    newImageData._id = imageToUpdate._id;
    newImageData.id = imageToUpdate.id;

    this.newImage = newImageData;

    await this.deleteImageFile();
    await this.createImageFile(this.imageValue);

    await this.patchManager.PatchCreate({
      type: "PATCH",
      status: "ACCEPTED",
      note,
      target: { id: newImageData.id },
      targetPath: "Image",
      author: { id: this.user!.id },
    });

    return newImageData;
  }

  public async updateRequest(imageID: string, note?: string) {
    const newImageData = new ImageModel({
      ...this.newData,
      targetPath: this.targetPath,
      isVerified: false
    });

    const imageToUpdate = await ImageModel.findOne(
      { id: imageID },
      {},
      { session: this.session },
    );

    if (!imageToUpdate) throw new Error("Image not found");

    newImageData._id = imageToUpdate._id;
    newImageData.id = imageToUpdate.id;

    const changes = getChangedDataV2(imageToUpdate.toJSON(), newImageData, [
      "_id",
      "id",
      "isVerified",
      "createdAt",
      "updatedAt",
    ]);

    if (!changes?.newValues)
      throw new APIError(
        "Aucun changement n'a été détecté",
        "EMPTY_CHANGES",
        400,
      );

    await imageToUpdate.updateOne(
      { $set: changes.newValues },
      { session: this.session },
    );

    await this.patchManager.PatchCreate({
      type: "UPDATE_REQUEST",
      status: "PENDING",
      target: { id: newImageData.id },
      note,
      targetPath: "Image",
      newValues: changes?.newValues,
      oldValues: changes?.oldValues,
      author: { id: this.user!.id },
    });

    return newImageData;
  }

  public async createRelation(relation: IAdd_Image_ZOD, controlledSave?: boolean) {
    if (relation.newImage) {
      let newImage;
      const image = this.init(relation.newImage);

      if (this.isRequest) {
        newImage = await image.createRequest(null, controlledSave);
      } else {
        newImage = await image.create(null, controlledSave);
      }
      return {
        id: newImage.id,
        label: relation.label || relation.newImage.label,
      };
    } else if (relation.id && (await ImageModel.exists({ id: relation.id }))) {
      return { id: relation.id, label: relation.label };
    } else {
      console.error(relation);
      throw new APIError(
        "Le format des données de l'image sont invalides.",
        "BAD_ENTRY",
        400,
      );
    }
  }

  public async createMultipleRelation(relations: IAdd_Image_ZOD[]) {
    const relList: { id: string; label?: IImageLabel }[] = [];
    for await (const relation of relations.filter(
      (rel) => rel && Object.keys(rel).length > 0,
    )) {
      const rel = await this.createRelation(relation);
      relList.push(rel);
    }
    return relList;
  }

  public async createRelationFromURL(relation: IAdd_Image_ZOD) {
    if (relation.newImage) {
      const newImage = await this.init(relation.newImage).createFromURL();
      return {
        id: newImage.id,
        label: relation.label || relation.newImage.label,
      };
    } else if (relation.id && (await ImageModel.exists({ id: relation.id }))) {
      return { id: relation.id, label: relation.label };
    } else {
      console.error(relation);
      throw new APIError(
        "Le format des données de l'image sont invalides.",
        "BAD_ENTRY",
        400,
      );
    }
  }

  public async getChanges(sourceID: string, ignoreKeys?: string[]) {
    const oldValues = await this.get(sourceID);
    const model = new ImageModel({ ...oldValues, ...this.newData });
    await model.validate();

    const newValues = model.toJSON();

    return getChangedDataV2<IImage>(oldValues, newValues, ignoreKeys || ["_id", "createdAt", "updatedAt"]);
  }
}
