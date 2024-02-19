import { Arg, Authorized, Info, Mutation, Query, Resolver } from "type-graphql";
import { MediaSearchLogic, Pagination } from "../../utils";
import { PersonMedia, PersonModel, PersonPaginationOutput } from "./_person.model";
import { Person, PersonSearchQuery } from "./_person.type";
import { fieldsProjection } from 'graphql-fields-list'
import { PaginationQuery } from "../../utils/_pagination";
import { PersonInput } from "./_person.input";
import { IUserRoles } from "../users/_user.type";


@Resolver(Person)
export class PersonResolver {

    @Query(_return => Person, { nullable: true })
    async getPerson(@Arg("id", () => String) id: string, @Info() info: any) {

        const projection = info ?
            Object.fromEntries(
                Object.keys(
                    Object.assign(fieldsProjection(info), { id: 1 })
                ).map(key => [key.replace(key, 'data.' + key), 1])) : {};

        console.log(projection)

        const findPerson = await PersonModel.findOne({ id }, { id: 1, ...projection }).lean();

        console.log('getPerson', findPerson);
        // TODO: check le statut (public ou non etc...)
        if (findPerson && findPerson.data) {

            console.log("CA RETOURNE")
            const { id, data } = findPerson;

            return data;

        } else {
            return null;
        }

    }

    @Query(_returns => PersonPaginationOutput, { nullable: true })
    async searchPersons(

        @Arg("pagination", () => Pagination, { nullable: true })
        pagination: Pagination | null,

        @Arg("searchQuery", () => PersonSearchQuery, { nullable: true })
        searchQuery: PersonSearchQuery | null,

        @Arg("searchLogic", () => MediaSearchLogic, { nullable: true, defaultValue: 'OR' })
        searchLogic: MediaSearchLogic,

        @Info()
        info: any

    ): Promise<PersonPaginationOutput | null> {

        console.log('searchPersons');

        const queryGen = PersonModel.find();
        // .find({ data: { $ne: null } });

        console.log('searchQuery', searchQuery)

        if (searchQuery)
            queryGen.queryParse(searchQuery, searchLogic)


        return PaginationQuery({
            model: PersonModel,
            paginationQuery: pagination,
            filter: queryGen.getQuery(),
            info,
            customProjection: searchQuery ? PersonSearchQuery.genProjection(searchQuery) : {}
        });
    }

    @Query(_returns => PersonMedia, { nullable: true })
    async getFullPerson(@Arg("id", () => String) id: String) {

        const findPerson = await PersonModel.findOne({ id }).lean();

        console.log('getFullPerson', findPerson, id);

        if (findPerson) {
            const sortedUpdate = findPerson.updates?.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            // const sortedUpdateRequest = findPerson.requests?.sort(sortByCreatedAt);

            return findPerson
        } else {
            return null;
        }
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