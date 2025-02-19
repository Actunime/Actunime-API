import { ITargetPath } from "@actunime/types";
import { Model } from "mongoose";
import { AnimeManager } from "./anime";
import { CharacterManager } from "./character";
import { CompanyManager } from "./company";
import { TrackManager } from "./track";
import { PersonManager } from "./person";
import { GroupeManager } from "./groupe";
import { MangaManager } from "./manga";
import { UserManager } from "./user";
import { ImageManager } from "./image";





export function ManagerByPath(path: ITargetPath) {

    const managers = {
        Anime: AnimeManager,
        Character: CharacterManager,
        Company: CompanyManager,
        Track: TrackManager,
        Person: PersonManager,
        Groupe: GroupeManager,
        Manga: MangaManager,
        User: UserManager,
        Image: ImageManager,
    };

    return managers[path as keyof typeof managers];
}