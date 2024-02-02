import { ObjectType } from "type-graphql";
import { MediaFormat, MediaFormatOutput } from "../../utils/_media.format";
// import { PaginationOutput } from "../../utils/_media.pagination";
import { Person } from "./_person.type";
import { Pre, getModelForClass, modelOptions } from "@typegoose/typegoose";
import { genMediaFromUpdate } from "../../utils/_genMediaFromUpdate";

// @ObjectType()
// class PersonUpdates extends MediaUpdateFormat<Person>(Person) { };
// @ObjectType()
// class PersonRequests extends MediaRequestFormat<Person>(Person) { };


@ObjectType()
export class PersonMediaOutput extends MediaFormatOutput<Person>(Person) { }

// @ObjectType()
// export class PersonMediaPaginationOutput extends PaginationOutput<PersonMediaOutput>(PersonMediaOutput) { }

// @ObjectType()
// export class PersonPaginationOutput extends PaginationOutput<Person>(Person) { }


@Pre<PersonMedia>('save', function (next) {
    this.data = genMediaFromUpdate<Person>(this.updates.filter(u => u.visible));
    next()
})

@ObjectType({ description: "Format Media dans la base de données" })
@modelOptions({ options: { customName: "Person" } })
export class PersonMedia extends MediaFormat<Person>(Person) { }

const PersonModel = getModelForClass<typeof PersonMedia>(PersonMedia, { schemaOptions: { toJSON: { virtuals: true } } });

export { PersonModel }