import { ITargetPath } from "@actunime/types";

export async function ModelsPath(path: ITargetPath) {

    const models = {
        Anime: (await import("@actunime/mongoose-models")).AnimeModel,
        Character: (await import("@actunime/mongoose-models")).CharacterModel,
        Company: (await import("@actunime/mongoose-models")).CompanyModel,
        Track: (await import("@actunime/mongoose-models")).TrackModel,
        Person: (await import("@actunime/mongoose-models")).PersonModel,
        Groupe: (await import("@actunime/mongoose-models")).GroupeModel,
        Manga: (await import("@actunime/mongoose-models")).MangaModel,
        User: (await import("@actunime/mongoose-models")).UserModel,
        Image: (await import("@actunime/mongoose-models")).ImageModel
    };

    return models[path as keyof typeof models];
}