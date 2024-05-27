import { ITargetPath } from "../_utils/global";

import { GroupeDataToZOD } from "./groupeZOD";
import { Create_Manga_ZOD, MangaDataToZOD } from "./mangaZOD";
import { AnimeDataToZOD, Create_Anime_ZOD } from "./animeZOD";
import { Create_Person_ZOD, PersonDataToZOD } from "./personZOD";
import { CharacterDataToZOD, Create_Character_ZOD } from "./characterZOD";
import { Create_Track_ZOD, TrackDataToZOD } from "./trackZOD";
import { CompanyDataToZOD, Create_Company_ZOD } from "./companyZOD";
import { z } from "zod";

// export const TargetPathToZod: Record<ITargetPath, (data: any) => any> = {
//     Groupe: GroupeDataToZOD,
//     Manga: MangaDataToZOD,
//     Anime: AnimeDataToZOD,
//     Person: PersonDataToZOD,
//     Character: CharacterDataToZOD,
//     Track: TrackDataToZOD,
//     Company: CompanyDataToZOD,
//     ...{} as Record<ITargetPath, ((data: any) => void) | undefined>
// }
export const TargetPathZodResolver = {
    Anime: Create_Anime_ZOD,
    Manga: Create_Manga_ZOD,
    Character: Create_Character_ZOD,
    Person: Create_Person_ZOD,
    Company: Create_Company_ZOD,
    Track: Create_Track_ZOD
}