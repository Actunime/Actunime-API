import { CharacterModelWithAnime, CharacterWithAnime } from "../animesRequests/_interfaces";
import { CharacterRequestProps } from "./_interfaces";
import { CharacterRequestModel, CharacterRequestSchema } from "./_model";



export class CharacterRequestResolver {
    public static async toFormatedModel(args: CharacterWithAnime[]) {

        return Promise.all(args.map(async ({ relationDesc, data }) => {
            const characterModel = new CharacterRequestModel(data);
            await characterModel.validate();

            return {
                relationDesc,
                data: characterModel
            };
        }))

    }


    public static async saveAndReturnIds(args: CharacterModelWithAnime[]) {

        return Promise.all(args.map(async ({ relationDesc, data }) => {
            let saved = await data.save();
            return {
                relationDesc,
                data: saved._id
            };
        }))

    }
}