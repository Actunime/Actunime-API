import charactersJSON from '../../mokes/characters.json';
import personsJSON from '../../mokes/persons.json';
import tracksJSON from '../../mokes/tracks.json';
import companysJSON from '../../mokes/companys.json';
import groupesJSON from '../../mokes/groupes.json';
import animesJSON from '../../mokes/animes.json';
import patchsJSON from '../../mokes/patches.json';
import {
  AnimeModel,
  CharacterModel,
  CompanyModel,
  GroupeModel,
  PatchModel,
  PersonModel,
  TrackModel,
} from '../../src/_lib/models';
let loaded = false;
export default async function loadMokes() {
  if (loaded) return;
  const hasData = await AnimeModel.countDocuments();
  if (hasData) {
    loaded = true;
    return;
  }
  try {
    await AnimeModel.insertMany(animesJSON);
    await CharacterModel.insertMany(charactersJSON);
    await PersonModel.insertMany(personsJSON);
    await TrackModel.insertMany(tracksJSON);
    await CompanyModel.insertMany(companysJSON);
    await GroupeModel.insertMany(groupesJSON);
    await PatchModel.insertMany(patchsJSON);
  } catch (error) {
    console.error('MOCK ERROR', error);
  }
  loaded = true;
}
