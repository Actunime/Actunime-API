import { ImageModel } from "@actunime/mongoose-models";
import { ClientSession } from "mongoose";
import { APIError } from "../_lib/Error";
import { ICreate_Image_ZOD } from "@actunime/validations";
import { CreateImageCDN, DeleteImageCDN, ITargetPath } from "@actunime/types";

class Image {
    private model: typeof ImageModel;
    private session: ClientSession | null = null;

    constructor(model: typeof ImageModel) { this.model = model; }
    useSession(session: ClientSession) { this.session = session; }

    async getById(id: string) {
        const res = await this.model.findOne({ id }).cache("1m");
        if (!res) throw new APIError("Aucune n'a été trouvé", "NOT_FOUND");
        return res;
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
        const newImage = new this.model({ label, target, targetPath });

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
        await this.model.findOneAndDelete({ id })
            .session(this.session);
    }
}

export const ImageControllers = new Image(ImageModel);