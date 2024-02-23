import { Arg, Authorized, Info, Mutation, Query, Resolver } from "type-graphql";
import { MediaSearchLogic, Pagination } from "../../utils";
import { PersonMedia, PersonMediaPagination, PersonModel } from "./_person.model";
import { Person, PersonSearchQuery } from "./_person.type";
import { PaginationQuery } from "../../utils/_pagination";
import { PersonInput } from "./_person.input";
import { IUserRoles } from "../users/_user.type";


@Resolver(Person)
export class PersonResolver {

    @Query(_return => PersonMedia, { nullable: true })
    async person(@Arg("id", () => String) id: string, @Info() info: any) {
        try {
            const person = await PersonModel.findOne({ id, data: { $ne: undefined } }).dynamicPopulate(info)
            return person?.toJSON();
        } catch (err) {
            console.error(err)
            return null
        }
    }

    @Query(_returns => PersonMediaPagination, { nullable: true })
    async persons(

        @Arg("pagination", () => Pagination, { nullable: true })
        paginationQuery: Pagination | null,

        @Arg("searchQuery", () => PersonSearchQuery, { nullable: true })
        searchQuery: PersonSearchQuery | null,

        @Arg("searchLogic", () => MediaSearchLogic, { nullable: true, defaultValue: 'OR' })
        searchLogic: MediaSearchLogic,

        @Info()
        info: any

    ): Promise<PersonMediaPagination | null> {

        const filter = PersonSearchQuery.parse<typeof PersonModel>(searchQuery, searchLogic);

        console.log('query', filter)

        return PaginationQuery({
            model: PersonModel,
            paginationQuery,
            filter,
            info,
            customProjection: searchQuery ? PersonSearchQuery.genProjection(searchQuery) : {}
        });
    }
    @Mutation(_ => Person, { description: "Ajouter un (nouvel) person (staff)" })
    async createPerson(@Arg("data", _ => PersonInput) dataInput: PersonInput) {

        const update = await PersonInput.createUpdate(
            dataInput, 'direct_update', {
            author: '',
            verifiedBy: ''
        }
        );

        let model = await update.save();

        let json = model.toJSON();

        return json.data
    }

    @Authorized<IUserRoles>(IUserRoles['ADMIN'])
    async updatePerson(
        @Arg("id", () => String) id: string,
        @Arg("data", _ => PersonInput) dataInput: PersonInput
    ) {

        const update = await PersonInput.createUpdate(dataInput, 'direct_update', {
            author: '',
            verifiedBy: ''
        });

        let data = await update.addTo(id);

        if (!data) return null;

        return data.data;
    }
}