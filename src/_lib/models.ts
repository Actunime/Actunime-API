import { ActivitySchema, AnimeSchema, CharacterSchema, CompanySchema, GroupeSchema, ImageSchema, MangaSchema, PatchSchema, PersonSchema, TrackSchema, userSchema } from "@actunime/mongoose-models";
import { IActivity, IAnime, ICharacter, ICompany, IGroupe, IImage, IManga, IMediaDB, IPatch, IPerson, ITargetPath, ITrack, IUser } from "@actunime/types";
import { Document, Model, model } from "mongoose";

export type ModelDoc<T> = (Document<unknown, {}, T> & T & IMediaDB) | null;
export const AnimeModel = model("Anime", AnimeSchema) as unknown as Model<ModelDoc<IAnime>>;
export const MangaModel = model("Manga", MangaSchema) as unknown as Model<ModelDoc<IManga>>;
export const CharacterModel = model("Character", CharacterSchema) as unknown as Model<ModelDoc<ICharacter>>;
export const PersonModel = model("Person", PersonSchema) as unknown as Model<ModelDoc<IPerson>>;
export const CompanyModel = model("Company", CompanySchema) as unknown as Model<ModelDoc<ICompany>>;
export const TrackModel = model("Track", TrackSchema) as unknown as Model<ModelDoc<ITrack>>;
export const PatchModel = model("Patch", PatchSchema) as unknown as Model<ModelDoc<IPatch>>;
export const ImageModel = model("Image", ImageSchema) as unknown as Model<ModelDoc<IImage>>;
export const ActivityModel = model("Activity", ActivitySchema) as unknown as Model<ModelDoc<IActivity>>;
export const GroupeModel = model("Groupe", GroupeSchema) as unknown as Model<ModelDoc<IGroupe>>;
export const UserModel = model("User", userSchema) as unknown as Model<ModelDoc<IUser>>;


export async function ModelByPath(path: ITargetPath) {

    const models = {
        Anime: AnimeModel,
        Character: CharacterModel,
        Company: CompanyModel,
        Track: TrackModel,
        Person: PersonModel,
        Groupe: GroupeModel,
        Manga: MangaModel,
        User: UserModel,
        Image: ImageModel
    };

    return models[path as keyof typeof models];
}