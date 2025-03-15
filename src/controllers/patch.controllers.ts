import { PatchModel } from "@actunime/mongoose-models";
import { ClientSession, Document, Schema } from "mongoose";
import { APIError } from "../_lib/Error";
import { IPatch, IPatchStatus, ITargetPath, IUser } from "@actunime/types";
import { PaginationControllers } from "./pagination.controllers";
import { z } from "zod";
import { PatchPaginationBody } from "@actunime/validations";
import { UtilControllers } from "../_utils/_controllers";
import LogSession from "../_utils/_logSession";

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

class PatchController extends UtilControllers.withUser {
    session: ClientSession | null = null;
    log: LogSession | undefined

    constructor(session: ClientSession | null, options?: { log?: LogSession, user?: IUser }) {
        super(options?.user);
        this.session = session;
        this.log = options?.log;
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

    async filter(pageFilter: z.infer<typeof PatchPaginationBody>) {
        const pagination = new PaginationControllers(PatchModel);

        pagination.useFilter(pageFilter);
        pagination.setVerifiedOnly(false);

        const res = await pagination.getResults();

        console.log("results", res)
        return res;
    }

    async fitlerPatchFrom(targetPath: ITargetPath, target: string, status?: IPatchStatus) {
        const res = await PatchModel.find({ targetPath, target, status }).cache("60m");
        return res;
    }

    async create(data: Partial<IPatch>) {
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

export { PatchController };