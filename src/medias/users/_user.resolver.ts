



import { Arg, Authorized, Info, Query, Resolver } from "type-graphql";
import { MediaSearchLogic, Pagination } from "../../utils";
import { UserModel, UserPaginationOutput, } from "./_user.model";
import { User, UserSearchQuery } from "./_user.type";
import { fieldsProjection } from 'graphql-fields-list'
import { UserPaginationQuery } from "../../utils/_pagination";


@Resolver(User)
export class UserResolver {

    @Query(_return => User, { nullable: true })
    async getUser(@Arg("id", () => String) id: string, @Info() info: any) {

        const user = await UserModel.findOne({ id }, fieldsProjection(info)).lean();

        return user;
    }

    @Query(_returns => UserPaginationOutput, { nullable: true })
    async searchUsers(

        @Arg("pagination", () => Pagination, { nullable: true })
        pagination: Pagination | null,

        @Arg("searchQuery", () => UserSearchQuery, { nullable: true })
        searchQuery: UserSearchQuery | null,

        @Arg("searchLogic", () => MediaSearchLogic, { nullable: true, defaultValue: 'OR' })
        searchLogic: MediaSearchLogic,

        @Info()
        info: any

    ): Promise<UserPaginationOutput | null> {

        console.log('searchUsers');

        const queryGen = UserModel.find();
        // .find({ data: { $ne: null } });

        console.log('searchQuery', searchQuery)

        if (searchQuery)
            queryGen.queryParse(searchQuery, searchLogic)


        return UserPaginationQuery({
            model: UserModel,
            paginationQuery: pagination,
            filter: queryGen.getQuery(),
            info,
            // customProjection: searchQuery ? UserSearchQuery.genProjection(searchQuery) : {}
        });
    }

}