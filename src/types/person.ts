import { PersonGender, PersonName } from "./utils"


export interface PersonBase {
    id: string
    name: PersonName
    age: number
    dateOfBirth: Date,
    gender: PersonGender,
    description: string,
    image: string,
    createdAt: Date
    editedAt: Date
}

