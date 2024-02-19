import { Arg, Authorized, Info, Mutation, Query, Resolver } from "type-graphql";
import { MediaSearchLogic, Pagination } from "../../utils";
import { TrackMedia, TrackModel, TrackPaginationOutput } from "./_track.model";
import { Track, TrackSearchQuery } from "./_track.type";
import { fieldsProjection } from 'graphql-fields-list'
import { PaginationQuery } from "../../utils/_pagination";
import { TrackInput } from "./_track.input";
import { IUserRoles } from "../users/_user.type";


@Resolver(Track)
export class TrackResolver {

    @Query(_return => Track, { nullable: true })
    async getTrack(@Arg("id", () => String) id: string, @Info() info: any) {

        const projection = info ?
            Object.fromEntries(
                Object.keys(
                    Object.assign(fieldsProjection(info), { id: 1 })
                ).map(key => [key.replace(key, 'data.' + key), 1])) : {};

        console.log(projection)

        const findTrack = await TrackModel.findOne({ id }, { id: 1, ...projection }).lean();

        console.log('getTrack', findTrack);
        // TODO: check le statut (public ou non etc...)
        if (findTrack && findTrack.data) {

            console.log("CA RETOURNE")
            const { id, data } = findTrack;

            return data;

        } else {
            return null;
        }

    }

    @Query(_returns => TrackPaginationOutput, { nullable: true })
    async searchTracks(

        @Arg("pagination", () => Pagination, { nullable: true })
        pagination: Pagination | null,

        @Arg("searchQuery", () => TrackSearchQuery, { nullable: true })
        searchQuery: TrackSearchQuery | null,

        @Arg("searchLogic", () => MediaSearchLogic, { nullable: true, defaultValue: 'OR' })
        searchLogic: MediaSearchLogic,

        @Info()
        info: any

    ): Promise<TrackPaginationOutput | null> {

        console.log('searchTracks');

        const queryGen = TrackModel.find();
        // .find({ data: { $ne: null } });

        console.log('searchQuery', searchQuery)

        if (searchQuery)
            queryGen.queryParse(searchQuery, searchLogic)


        return PaginationQuery({
            model: TrackModel,
            paginationQuery: pagination,
            filter: queryGen.getQuery(),
            info,
            customProjection: searchQuery ? TrackSearchQuery.genProjection(searchQuery) : {}
        });
    }

    @Query(_returns => TrackMedia, { nullable: true })
    async getFullTrack(@Arg("id", () => String) id: String) {

        const findTrack = await TrackModel.findOne({ id }).lean();

        console.log('getFullTrack', findTrack, id);

        if (findTrack) {
            const sortedUpdate = findTrack.updates?.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            // const sortedUpdateRequest = findTrack.requests?.sort(sortByCreatedAt);

            return findTrack
        } else {
            return null;
        }
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