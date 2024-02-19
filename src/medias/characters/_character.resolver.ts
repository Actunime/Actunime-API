import { Arg, Authorized, Info, Mutation, Query, Resolver } from "type-graphql";
import { MediaSearchLogic, Pagination } from "../../utils";
import { CharacterMedia, CharacterModel, CharacterPaginationOutput } from "./_character.model";
import { Character, CharacterSearchQuery } from "./_character.type";
import { fieldsProjection } from 'graphql-fields-list'
import { PaginationQuery } from "../../utils/_pagination";
import { CharacterInput } from "./_character.input";
import { IUserRoles } from "../users/_user.type";


@Resolver(Character)
export class CharacterResolver {

    @Query(_return => Character, { nullable: true })
    async getCharacter(@Arg("id", () => String) id: string, @Info() info: any) {

        const projection = info ?
            Object.fromEntries(
                Object.keys(
                    Object.assign(fieldsProjection(info), { id: 1 })
                ).map(key => [key.replace(key, 'data.' + key), 1])) : {};

        console.log(projection)

        const findCharacter = await CharacterModel.findOne({ id }, { id: 1, ...projection }).lean();

        console.log('getCharacter', findCharacter);
        // TODO: check le statut (public ou non etc...)
        if (findCharacter && findCharacter.data) {

            console.log("CA RETOURNE")
            const { id, data } = findCharacter;

            return data;

        } else {
            return null;
        }

    }

    @Query(_returns => CharacterPaginationOutput, { nullable: true })
    async searchCharacters(

        @Arg("pagination", () => Pagination, { nullable: true })
        pagination: Pagination | null,

        @Arg("searchQuery", () => CharacterSearchQuery, { nullable: true })
        searchQuery: CharacterSearchQuery | null,

        @Arg("searchLogic", () => MediaSearchLogic, { nullable: true, defaultValue: 'OR' })
        searchLogic: MediaSearchLogic,

        @Info()
        info: any

    ): Promise<CharacterPaginationOutput | null> {

        console.log('searchCharacters');

        const queryGen = CharacterModel.find();
        // .find({ data: { $ne: null } });

        console.log('searchQuery', searchQuery)

        if (searchQuery)
            queryGen.queryParse(searchQuery, searchLogic)


        return PaginationQuery({
            model: CharacterModel,
            paginationQuery: pagination,
            filter: queryGen.getQuery(),
            info,
            customProjection: searchQuery ? CharacterSearchQuery.genProjection(searchQuery) : {}
        });
    }

    @Query(_returns => CharacterMedia, { nullable: true })
    async getFullCharacter(@Arg("id", () => String) id: String) {

        const findCharacter = await CharacterModel.findOne({ id }).lean();

        console.log('getFullCharacter', findCharacter, id);

        if (findCharacter) {
            const sortedUpdate = findCharacter.updates?.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            // const sortedUpdateRequest = findCharacter.requests?.sort(sortByCreatedAt);

            return findCharacter
        } else {
            return null;
        }
    }

    @Mutation(_ => Character, { description: "Ajouter un (nouvel) character (staff)" })
    async createCharacter(@Arg("data", _ => CharacterInput) dataInput: CharacterInput) {

        const update = await CharacterInput.createUpdate(
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
    async updateCharacter(
        @Arg("id", () => String) id: string,
        @Arg("data", _ => CharacterInput) dataInput: CharacterInput
    ) {

        const update = await CharacterInput.createUpdate(dataInput, 'direct_update', {
            author: '',
            verifiedBy: ''
        });

        let data = await update.addTo(id);

        if (!data) return null;

        return data.data;
    }
}