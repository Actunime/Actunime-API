import { model } from "mongoose";
import { PersonSchema, PersonSchemaV2 } from "./_Person.schemas";




export const PersonModel = model('personRequest', PersonSchemaV2, 'personRequests');