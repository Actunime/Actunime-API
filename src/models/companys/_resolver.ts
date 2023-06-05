// test a faire avec le nouveau _model.ts (voir si sa ce crée dans le base de donnée);
import * as Updates from '../updates';
import { Companys } from "..";





class Resolver {
    static Query = {

    }
    static Mutation = {

    }

    static async create(input: any, user: any, options?: { save: boolean, updateRef: number }) {

        let newData = new Companys.Model({ ...input });
        await newData.validate();

        let update = new Updates.Model({
            action: 'new',
            status: 'AWAIT_VERIFICATION',
            dbName: 'company',
            user: '',
            data: newData._id,
            ref: options?.updateRef
        });

        if (options?.save) {
            await newData.save();
            await update.save();
        }

        return {
            newData,
            update,
            saved: options?.save,
            error: false,
            message: "",
        };
    }

    static async exist(_id: number) {
        let dbExist = await Companys.Model.exists({ _id });
        if (dbExist?._id) return true
        else return false
    }
}


export { Resolver };