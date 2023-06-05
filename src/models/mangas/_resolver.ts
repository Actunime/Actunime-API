// test a faire avec le nouveau _model.ts (voir si sa ce crée dans le base de donnée);

import { Mangas } from "..";





class Resolver {
    static Query = {

    }
    static Mutation = {

    }

    static async exist(_id: number) {
        let dbExist = await Mangas.Model.exists({ _id });
        if (dbExist?._id) return true
        else return false
    }
}


export { Resolver };