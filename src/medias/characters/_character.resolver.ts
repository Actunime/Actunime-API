import { Arg, Authorized, Info, Mutation, Query, Resolver } from "type-graphql";
import { MediaSearchLogic, Pagination } from "../../utils";
import { CharacterMedia, CharacterMediaPagination, CharacterModel } from "./_character.model";
import { Character, CharacterSearchQuery } from "./_character.type";
import { PaginationQuery } from "../../utils/_pagination";
import { CharacterInput } from "./_character.input";
import { IUserRoles } from "../users/_user.type";


@Resolver(Character)
export class CharacterResolver {

    @Query(_return => CharacterMedia, { nullable: true })
    async character(@Arg("id", () => String) id: string, @Info() info: any) {
        try {
            const anime = await CharacterModel.findOne({ id, data: { $ne: undefined } }).dynamicPopulate(info)
            return anime?.toJSON();
        } catch (err) {
            console.error(err)
            return null
        }
    }

    @Query(_returns => CharacterMediaPagination, { nullable: true })
    async characters(

        @Arg("pagination", () => Pagination, { nullable: true })
        paginationQuery: Pagination | null,

        @Arg("searchQuery", () => CharacterSearchQuery, { nullable: true })
        searchQuery: CharacterSearchQuery | null,

        @Arg("searchLogic", () => MediaSearchLogic, { nullable: true, defaultValue: 'OR' })
        searchLogic: MediaSearchLogic,

        @Info()
        info: any

    ): Promise<CharacterMediaPagination | null> {

        const filter = CharacterSearchQuery.parse<typeof CharacterModel>(searchQuery, searchLogic);

        console.log('query', filter)

        return PaginationQuery({
            model: CharacterModel,
            paginationQuery,
            filter,
            info,
            customProjection: searchQuery ? CharacterSearchQuery.genProjection(searchQuery) : {}
        });
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