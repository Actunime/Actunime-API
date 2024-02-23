import { Arg, Authorized, Info, Mutation, Query, Resolver } from "type-graphql";
import { MediaSearchLogic, Pagination } from "../../utils";
import { TrackMedia, TrackMediaPagination, TrackModel } from "./_track.model";
import { Track, TrackSearchQuery } from "./_track.type";
import { PaginationQuery } from "../../utils/_pagination";
import { TrackInput } from "./_track.input";
import { IUserRoles } from "../users/_user.type";


@Resolver(Track)
export class TrackResolver {

    @Query(_return => TrackMedia, { nullable: true })
    async track(@Arg("id", () => String) id: string, @Info() info: any) {
        try {
            const track = await TrackModel.findOne({ id, data: { $ne: undefined } }).dynamicPopulate(info)
            return track?.toJSON();
        } catch (err) {
            console.error(err)
            return null
        }
    }

    @Query(_returns => TrackMediaPagination, { nullable: true })
    async tracks(

        @Arg("pagination", () => Pagination, { nullable: true })
        paginationQuery: Pagination | null,

        @Arg("searchQuery", () => TrackSearchQuery, { nullable: true })
        searchQuery: TrackSearchQuery | null,

        @Arg("searchLogic", () => MediaSearchLogic, { nullable: true, defaultValue: 'OR' })
        searchLogic: MediaSearchLogic,

        @Info()
        info: any

    ): Promise<TrackMediaPagination | null> {

        const filter = TrackSearchQuery.parse<typeof TrackModel>(searchQuery, searchLogic);

        console.log('query', filter)

        return PaginationQuery({
            model: TrackModel,
            paginationQuery,
            filter,
            info,
            customProjection: searchQuery ? TrackSearchQuery.genProjection(searchQuery) : {}
        });
    }

    @Mutation(_ => Track, { description: "Ajouter un (nouvel) track (staff)" })
    async createTrack(@Arg("data", _ => TrackInput) dataInput: TrackInput) {

        const update = await TrackInput.createUpdate(
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
    async updateTrack(
        @Arg("id", () => String) id: string,
        @Arg("data", _ => TrackInput) dataInput: TrackInput
    ) {

        const update = await TrackInput.createUpdate(dataInput, 'direct_update', {
            author: '',
            verifiedBy: ''
        });

        let data = await update.addTo(id);

        if (!data) return null;

        return data.data;
    }
}