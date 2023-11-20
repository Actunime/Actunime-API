import { PersonRequestProps } from "../personsRequests/_interfaces"

export interface CharacterRequestProps {
    name: {
        start: string,
        end: string,
        alias: string[]
    }
    age: number,
    birthDate: string,
    gender: string,
    species: string,
    bio: string,
    image: string,
    actors: ActorsForCharacterRequest[]
}


export interface CharacterRequestModel extends CharacterRequestProps {
    _id: number,
    createdAt: Date,
    editedAt: Date,
    verified: boolean
}

interface ActorsForCharacterRequest {
    old: number[],
    new: PersonRequestProps[]
}