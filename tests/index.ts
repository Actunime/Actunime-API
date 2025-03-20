import dotenv from 'dotenv';
dotenv.config({
  path: [`.env.${process.env.NODE_ENV || 'development'}`.trim()],
});
import { IAnimeCreateBody } from '@actunime/validations/_animeZOD';
import { IPersonRole, ICharacterRole } from '@actunime/types/index';
import { ICharacterAddBody } from '@actunime/validations/_characterZOD';
import { ICompanyAddBody } from '@actunime/validations/_companyZOD';
import { IGroupeAddBody } from '@actunime/validations/_groupeZOD';
import { IPersonAddBody } from '@actunime/validations/_personZOD';
import { ITrackAddBody } from '@actunime/validations/_trackZOD';
import charactersJSON from '../mokes/characters.json';
import personsJSON from '../mokes/persons.json';
import tracksJSON from '../mokes/tracks.json';
import companysJSON from '../mokes/companys.json';
import groupesJSON from '../mokes/groupes.json';
import animesJSON from '../mokes/animes.json';
import { connectDB } from '../src/_utils';
import mongoose from 'mongoose';

export const removeDBKeys = <T extends any>(obj: any) => {
  delete obj.id;
  delete obj._id;
  delete obj.__v;
  delete obj.createdAt;
  delete obj.updatedAt;
  delete obj.isVerified;
  return obj as T;
};

export const personModel = (id: string, role?: IPersonRole): IPersonAddBody => {
  let newPerson = removeDBKeys<IPersonAddBody['newPerson']>(
    personsJSON.find((c) => c.id === id)
  );
  return {
    role,
    newPerson,
  };
};

export const characterModel = (
  id: string,
  role?: ICharacterRole
): ICharacterAddBody => {
  let newCharacter = removeDBKeys<ICharacterAddBody['newCharacter']>(
    charactersJSON.find((c) => c.id === id)
  );
  return {
    role,
    newCharacter,
  };
};

export const trackModel = (id: string): ITrackAddBody => {
  let newTrack = removeDBKeys<ITrackAddBody['newTrack']>(
    tracksJSON.find((c) => c.id === id)
  );
  return {
    newTrack,
  };
};

export const groupeModel = (id: string): IGroupeAddBody => {
  const newGroupe = removeDBKeys<IGroupeAddBody['newGroupe']>(
    groupesJSON.find((c) => c.id === id)
  );
  return {
    newGroupe,
  };
};

export const companyModel = (id: string): ICompanyAddBody => {
  let newCompany = removeDBKeys<ICompanyAddBody['newCompany']>(
    companysJSON.find((c) => c.id === id)
  );
  return { newCompany };
};

export const AnimeTestData: IAnimeCreateBody['data'] = removeDBKeys<
  IAnimeCreateBody['data']
>(animesJSON[0]);

// Ajouter un faux Groupe
AnimeTestData.groupe = groupeModel('2snsj');

// Ajouter des personnages;
AnimeTestData.characters = [{ id: 'xuof1j3c', role: 'ANTAGONISTE' }];
AnimeTestData.characters?.push(characterModel('44fwhd1h', 'PRINCIPAL'));

// Ajouter des staffs;
AnimeTestData.staffs = [{ id: '1lzgpgjb', role: 'ANIMATEUR_INTERMEDIAIRE' }];
AnimeTestData.staffs?.push(personModel('uw5c9xce', 'CHARACTER_DESIGNER'));

// Ajouter des tracks;
AnimeTestData.tracks = [{ id: '31b88djt' }];
AnimeTestData.tracks?.push(trackModel('vpf9o9ei'));

// Ajouter des compagnies;
AnimeTestData.companys = [{ id: '8q27pu1u' }];
AnimeTestData.companys?.push(companyModel('8q27pu1u'));

const start = async () => {
  await connectDB();
  // await (await import('./animes_routes/_update.request.test')).UPDATE_REQUEST();

  /** Tout tester */
  const res = await import('./animes_routes');
  await Promise.all(
    Object.entries(res).map(async ([, value]) => await value())
  );
  await mongoose.disconnect();
};

start();
