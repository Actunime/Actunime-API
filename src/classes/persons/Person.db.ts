import { model, Schema } from "mongoose"
import { PersonClassProps } from "./Person.class"
import { PersonRequestClassProps } from "./PersonRequest.class";
import { AutoIncrementIds } from "../../lib/mongoosePlugin";


// export const PersonSchema = new Schema<PersonClassProps>();
// export const PersonModel = model('person', PersonSchema, 'Persons');

export const PersonRequestSchema = new Schema<PersonRequestClassProps>({
    id: Number,
});

PersonRequestSchema.plugin(AutoIncrementIds.bind(null, 'personRequest'));

export const PersonRequestModel = model('personRequest', PersonRequestSchema, 'personRequests');