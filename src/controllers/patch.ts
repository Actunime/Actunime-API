import { PatchModel } from "@actunime/mongoose-models";
import { ClientSession, Document, Schema } from "mongoose";
import { APIError } from "../_lib/Error";
import { IPatch, IPatchOptionnal, IUser } from "@actunime/types";
import { PaginationControllers } from "../controllers/pagination.controllers";
import { z } from "zod";
import { PatchPaginationBody } from "@actunime/validations";
import { UtilControllers } from "../_utils/_controllers";

type IPatchDoc = (Document<unknown, unknown, IPatch> & IPatch & Required<{
    _id: Schema.Types.ObjectId;
}> & {
    __v: number;
}) | null;

interface IPatchResponse extends IPatch {
    parsedPatch: () => Partial<IPatch> | null
    setOriginal: () => void;
    setChanges: () => void;
}

type IPatchControlled = IPatchDoc & IPatchResponse

class PatchControllers extends UtilControllers.withUser {
    session: ClientSession | null = null;

    constructor(session: ClientSession | null, user: IUser | null) {
        super(user);
        this.session = session;
    }

    private parse(patch: Partial<IPatchDoc>) {
        delete patch?._id;

        return patch;
    }

    private warpper(data: IPatchDoc | null): IPatchControlled {
        if (!data)
            throw new APIError("Aucune mise a jour n'a été trouvé", "NOT_FOUND");

        const res = data as IPatchControlled;
        res.parsedPatch = this.parse.bind(this, data)

        return res;
    }

    async getById(id: string) {
        const res = await PatchModel.findOne({ id }).cache("60m");
        return this.warpper(res);
    }

    async filter(pageFilter: z.infer<typeof PatchPaginationBody>, options?: { onlyVerified: boolean }) {
        const pagination = new PaginationControllers(PatchModel);

        pagination.useFilter(pageFilter, options?.onlyVerified);

        const res = await pagination.getResults();

        return res;
    }

    async create(data: IPatchOptionnal) {
        const res = new PatchModel(data);
        await res.save({ session: this.session });
        return this.warpper(res);
    }

    async delete(id: string) {
        const res = await PatchModel.findOneAndDelete({ id }, { session: this.session });
        return this.warpper(res);
    }

    async update(id: string, data: Partial<IPatch>) {
        const res = await PatchModel.findOneAndUpdate({ id }, data, { session: this.session });
        return this.warpper(res);
    }
}

export { PatchControllers };