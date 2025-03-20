import { ClientSession, Document, Schema } from "mongoose";
import { APIError } from "../_lib/Error";
import { IActivity, ITargetPath, IUser } from "@actunime/types";
import { PaginationControllers } from "./pagination.controllers";
import { UtilControllers } from "../_utils/_controllers";
import LogSession from "../_utils/_logSession";
import { IActivityPaginationBody } from "@actunime/validations";
import { ActivityModel } from "../_lib/models";

type IActivityDoc = (Document<unknown, unknown, IActivity> & IActivity & Required<{
    _id: Schema.Types.ObjectId;
}> & {
    __v: number;
}) | null;

interface IActivityResponse extends IActivity {
    parsedActivity: () => Partial<IActivity> | null
    setOriginal: () => void;
    setChanges: () => void;
}

type IActivityControlled = IActivityDoc & IActivityResponse

class ActivityController extends UtilControllers.withUser {

    constructor(session: ClientSession | null, options?: { log?: LogSession, user?: IUser }) {
        super({ session, ...options });
    }

    private parse(Activity: Partial<IActivityDoc>) {
        delete Activity?._id;

        return Activity;
    }

    private warpper(data: IActivityDoc | null): IActivityControlled {
        if (!data)
            throw new APIError("Aucune mise a jour n'a été trouvé", "NOT_FOUND");

        const res = data as IActivityControlled;
        res.parsedActivity = this.parse.bind(this, data)

        return res;
    }

    async getById(id: string) {
        const res = await ActivityModel.findOne({ id }).cache("60m");
        return this.warpper(res);
    }

    async filter(pageFilter: IActivityPaginationBody) {
        const pagination = new PaginationControllers(ActivityModel);

        pagination.useFilter(pageFilter);
        pagination.setVerifiedOnly(false);

        const res = await pagination.getResults();

        console.log("results", res)
        return res;
    }

    async fitlerActivityFrom(targetPath: ITargetPath, target: string) {
        const res = await ActivityModel.find({ targetPath, target }).cache("60m");
        return res;
    }

    async create(data: Partial<IActivity>) {
        const res = new ActivityModel(data);
        await res.save({ session: this.session });
        return this.warpper(res);
    }

    async delete(id: string) {
        const res = await ActivityModel.findOneAndDelete({ id }, { session: this.session });
        return this.warpper(res);
    }

    async update(id: string, data: Partial<IActivity>) {
        const res = await ActivityModel.findOneAndUpdate({ id }, data, { session: this.session });
        return this.warpper(res);
    }
}

export { ActivityController };