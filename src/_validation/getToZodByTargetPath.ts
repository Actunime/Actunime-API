import { Create_Manga_ZOD } from './mangaZOD';
import { Create_Anime_ZOD } from './animeZOD';
import { Create_Person_ZOD } from './personZOD';
import { Create_Character_ZOD } from './characterZOD';
import { Create_Track_ZOD } from './trackZOD';
import { Create_Company_ZOD } from './companyZOD';

// export const TargetPathToZod: Record<ITargetPath, (data: any) => any> = {
//     Groupe: GroupeDataToZOD,
//     Manga: MangaDataToZOD,
//     Anime: AnimeDataToZOD,
//     Person: PersonDataToZOD,
//     Character: CharacterDataToZOD,
//     Track: TrackDataToZOD,
//     Company: CompanyDataToZOD,
//     ...object as Record<ITargetPath, ((data: any) => void) | undefined>
// }
export const TargetPathZodResolver = {
  Anime: Create_Anime_ZOD,
  Manga: Create_Manga_ZOD,
  Character: Create_Character_ZOD,
  Person: Create_Person_ZOD,
  Company: Create_Company_ZOD,
  Track: Create_Track_ZOD
};
