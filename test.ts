import dotenv from 'dotenv';
dotenv.config({ path: [`.env.${process.env.NODE_ENV || 'development'}`.trim()] });
import { AnimeCreateBody, IAdd_Character_ZOD, IAdd_Company_ZOD, IAdd_Groupe_ZOD, IAdd_Person_ZOD, IAdd_Track_ZOD, ICharacterCreateBody, ICreate_Anime_ZOD } from "@actunime/validations";
import charactersJSON from './test_data/characters.json';
import personsJSON from './test_data/persons.json';
import tracksJSON from './test_data/tracks.json';
import companysJSON from './test_data/companys.json';
import groupesJSON from './test_data/groupes.json';
import { ICharacterRole, IPersonRole } from '@actunime/types/index';

const removeDBKeys = (obj: any) => {
    if (!obj) return obj;
    delete obj.id;
    delete obj._id;
    delete obj.__v;
    delete obj.createdAt;
    delete obj.updatedAt;
    delete obj.isVerified;
    delete obj.isPreAdded;
    return obj;
}

const personModel = (id: string, role?: string): IAdd_Person_ZOD => {
    const newPerson = removeDBKeys(personsJSON.find(c => c.id === id));
    if (newPerson?.name.first || newPerson?.name.last) {
        newPerson.name.default = `${newPerson.name.first} ${newPerson.name.last}`;
        if (newPerson.name.first) delete newPerson.name.first;
        if (newPerson.name.last) delete newPerson.name.last;
    }
    return {
        role: role as IPersonRole,
        newPerson: {
            ...newPerson,
            avatar: undefined
        }
    }
}

const characterModel = (id: string, role: string): IAdd_Character_ZOD => {
    const newCharacter = removeDBKeys(charactersJSON.find(c => c.id === id));
    return {
        role: role as ICharacterRole,
        newCharacter: {
            ...newCharacter,
            actors: newCharacter.actors?.map(a => personModel(a.id)),
            avatar: undefined
        }
    }
}

const trackModel = (id: string): IAdd_Track_ZOD => {
    const newTrack = removeDBKeys(tracksJSON.find(c => c.id === id));
    return {
        newTrack: {
            ...newTrack,
            artists: newTrack.artists?.map(a => personModel(a.id)),
            cover: undefined
        }
    }
}

const groupeModel = (id: string): IAdd_Groupe_ZOD => {
    const newGroupe = removeDBKeys(groupesJSON.find(c => c.id === id));
    return {
        newGroupe
    }
}

const companyModel = (id: string): IAdd_Company_ZOD => {
    const newCompany = removeDBKeys(companysJSON.find(c => c.id === id));
    return {
        newCompany
    }
}

const animeModel: ICreate_Anime_ZOD = {
    "groupe": {
        "id": "eljeo"
    },
    "title": {
        "default": "Izure Saikyou no Renkinjutsushi?",
        "alias": [
            {
                "content": "Possibly the Greatest Alchemist of All Time"
            },
            {
                "content": " Someday Will I Be The Greatest Alchemist?"
            }
        ]
    },
    "date": {
        "start": "2025-01-01T00:00:00.000Z",
        "end": "2025-03-19T00:00:00.000Z"
    },
    // "cover": {
    //     "id": "gqzbx"
    // },
    // "banner": {
    //     "id": "tutlq"
    // },
    "synopsis": "Takumi Iruma, un homme ordinaire, a été invoqué dans un monde fantastique pour devenir un héros. Mais il n'en a pas les capacités et il demande juste à vivre simplement. La déesse Nolyn lui accorde alors le pouvoir de l'alchimie, une compétence ultra-puissante qui lui permet de créer n'importe quoi, comme des épées sacrées et même des vaisseaux volants. Une incroyable aventure commence alors pour lui !",
    "source": "LIGHT_NOVEL",
    "format": "SERIE",
    "vf": false,
    "trailer": "https://www.youtube.com/watch?v=1_KLp1C_lAQ",
    "genres": [
        "FANTAISIE"
    ],
    "status": "AIRING",
    "episodes": {
        "airing": 9,
        "nextAiringDate": "2025-03-05T17:30:00.000Z",
        "total": 12,
        "durationMinute": 23
    },
    "adult": false,
    "explicit": true,
    "links": [
        {
            "name": "Crunchyroll",
            "value": "https://www.crunchyroll.com/fr/series/GQWH0M1P3/possibly-the-greatest-alchemist-of-all-time"
        },
        {
            "name": "Site de l'Anime",
            "value": "https://izuresaikyo-pr.com/"
        },
        {
            "name": "X  (Twitter)",
            "value": "https://x.com/izuresaikyo_pr"
        }
    ],
    "companys": [
        {
            "id": "ywgyr"
        }
    ].map(c => companyModel(c.id)),
    "staffs": [
        {
            "id": "k783z",
            "role": "AUTEUR"
        },
        {
            "id": "wdlqx",
            "role": "AUTEUR"
        },
        {
            "id": "pifxy",
            "role": "REALISATEUR"
        },
        {
            "id": "z2ano",
            "role": "CHARACTER_DESIGNER"
        },
        {
            "id": "l8lrv",
            "role": "COMPOSITEUR"
        }
    ].map(s => personModel(s.id, s.role)),
    "characters": [
        {
            "id": "yn6qu",
            "role": "PRINCIPAL"
        },
        {
            "id": "ny7dq",
            "role": "SOUTIEN"
        },
        {
            "id": "l9hv5",
            "role": "SOUTIEN"
        },
        {
            "id": "kf35i",
            "role": "SOUTIEN"
        },
        {
            "id": "mfljy",
            "role": "SOUTIEN"
        },
        {
            "id": "h9bhy",
            "role": "SOUTIEN"
        }
    ].map(c => characterModel(c.id, c.role)),
    "tracks": [
        {
            "id": "dwuw5"
        },
        {
            "id": "msd4i"
        }
    ].map(t => trackModel(t.id)),
}

animeModel.groupe = groupeModel(animeModel.groupe.id!);

// console.log("AnimeModel", animeModel.staffs?.[0].newPerson?.name);

const createAnime = async () => {
    const parseData = AnimeCreateBody.parse({ data: animeModel, description: "TEST" });
    // console.log("parsedAnimeModel", parseData)
    const res = await fetch("http://localhost:3005/v1/animes/create", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(parseData),
    })
    const results = await res.json();
    console.log("results", results);
    
}

createAnime();