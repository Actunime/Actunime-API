import { model, Schema } from "mongoose"
import { CharacterClassProps } from "./Character.class"
import { CharacterRequestClassProps } from "./CharacterRequest.class";
import { AutoIncrementIds } from "../../lib/mongoosePlugin";


// export const CharacterSchema = new Schema<CharacterClassProps>();
// export const CharacterModel = model('character', CharacterSchema, 'characters');

export const CharacterRequestSchema = new Schema<CharacterClassProps>({
    id: Number,
});

CharacterRequestSchema.plugin(AutoIncrementIds.bind(null, 'characterRequest'))

export const CharacterRequestModel = model('characterRequest', CharacterRequestSchema, 'characterRequests');