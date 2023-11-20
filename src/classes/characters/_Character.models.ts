import { model } from "mongoose";
import { CharacterSchema } from "./_Character.schemas";



export const CharacterModel = model('characterRequest', CharacterSchema, 'characterRequests');