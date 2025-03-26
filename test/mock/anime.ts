import charactersJSON from '../../mokes/characters.json';
import personsJSON from '../../mokes/persons.json';
import tracksJSON from '../../mokes/tracks.json';
import companysJSON from '../../mokes/companys.json';
import groupesJSON from '../../mokes/groupes.json';
import { IPersonRole, ICharacterRole } from '@actunime/types';
import {
  IPersonAddBody,
  ICharacterAddBody,
  ITrackAddBody,
  IGroupeAddBody,
  ICompanyAddBody,
  IAnimeCreateBody,
} from '@actunime/validations';

export const removeDBKeys = <T>(obj: any) => {
  delete obj.id;
  delete obj._id;
  delete obj.__v;
  delete obj.createdAt;
  delete obj.updatedAt;
  delete obj.isVerified;
  return obj as T;
};

export const personModel = (id: string, role?: IPersonRole): IPersonAddBody => {
  const newPerson = removeDBKeys<IPersonAddBody['newPerson']>(
    JSON.parse(JSON.stringify(personsJSON)).find(
      (c: { id: string }) => c.id === id
    )
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
  const newCharacter = removeDBKeys<ICharacterAddBody['newCharacter']>(
    JSON.parse(JSON.stringify(charactersJSON)).find(
      (c: { id: string }) => c.id === id
    )
  );
  return {
    role,
    newCharacter,
  };
};

export const trackModel = (id: string): ITrackAddBody => {
  const newTrack = removeDBKeys<ITrackAddBody['newTrack']>(
    JSON.parse(JSON.stringify(tracksJSON)).find(
      (c: { id: string }) => c.id === id
    )
  );
  return {
    newTrack,
  };
};

export const groupeModel = (id: string): IGroupeAddBody => {
  const newGroupe = removeDBKeys<IGroupeAddBody['newGroupe']>(
    JSON.parse(JSON.stringify(groupesJSON)).find(
      (c: { id: string }) => c.id === id
    )
  );
  return {
    newGroupe,
  };
};

export const companyModel = (id: string): ICompanyAddBody => {
  const newCompany = removeDBKeys<ICompanyAddBody['newCompany']>(
    JSON.parse(JSON.stringify(companysJSON)).find(
      (c: { id: string }) => c.id === id
    )
  );
  return { newCompany };
};

export const AnimeCreateData: IAnimeCreateBody['data'] = {
  groupe: {
    newGroupe: {
      name: {
        default: 'A Tale of the Secret Saint (test)',
      },
    },
  },
  source: 'LIGHT_NOVEL',
  title: {
    default: 'A Tale of the Secret Saint (test)',
    alias: ['The Reincarnated Great Saint Conceals That She Is a Saint'],
  },
  synopsis:
    "Depuis son plus jeune âge, Fia rêve de devenir chevaleresse. Un rêve initialement à sa portée, puisqu'elle est issue d'une prestigieuse famille de chevaliers. Malheureusement, elle manque cruellement de talent... et de chance. En effet, lors de sa première mission, alors qu'elle est censée occire un démon mineur, elle se trouve nez à nez avec un dragon.",
  date: {},
  status: 'SOON',
  format: 'SERIE',
  vf: false,
  episodes: {},
  adult: false,
  explicit: true,
  genres: ['FANTAISIE'],
  links: [{ name: 'Google', value: 'https://google.com' }],
  companys: [
    { id: '8q27pu1u' },
    {
      newCompany: {
        name: { default: 'Madhouse' },
        type: 'STUDIO',
        createdDate: {
          year: 2011,
          month: 6,
          day: 14,
        },
      },
    },
  ],
  staffs: [
    { id: 'k4n9zhre' },
    {
      newPerson: {
        name: {
          default: 'Nakamura Hiroshi',
          alias: [],
        },
        links: [
          {
            name: 'Profil',
            value: 'https://musicrayn.com/amamiya_sora',
          },
        ],
      },
    },
  ],
  characters: [
    { id: 'xuof1j3c' },
    {
      newCharacter: {
        name: {
          default: 'Sora Amamiya',
          alias: [],
        },
        gender: 'FEMININ',
        species: 'AUTRE',
        actors: [
          {
            id: '8gbuso47',
          },
        ],
      },
    },
  ],
  tracks: [
    {
      id: 'vpf9o9ei',
    },
    {
      newTrack: {
        type: 'OPENING',
        name: {
          default: 'TREASURE!',
        },
        releaseDate: {
          year: 2025,
          month: 1,
          day: 29,
        },
        artists: [
          {
            id: '0r84haok',
          },
        ],
        links: [
          {
            name: 'TREASURE!',
            value: 'https://www.youtube.com/watch?v=8-6DJ3sOQO8',
          },
        ],
      },
    },
  ],
};
