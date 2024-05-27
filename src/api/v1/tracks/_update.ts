import { TrackSaveDB } from "../../../_server-utils/track";
import { ErrorHandled } from "../../../_server-utils/errorHandling";
import { RestrictedAPIRoute } from "../../../_server-utils/restricted";
import { Create_Track_ZOD, ICreate_Track_ZOD } from "../../../_validation/trackZOD";
import { FastifyRequest } from "fastify";


export async function Update(req: FastifyRequest<{ Params: { id: string }, Body: ICreate_Track_ZOD }>) {
    return RestrictedAPIRoute("TRACK_MODERATOR",
        () => new Response(JSON.stringify({ error: "Vous n'etes pas autorisé." }), { status: 401 }),
        async (user) => {
            let data;
            let parsedZOD;

            try {
                data = req.body;
                parsedZOD = Create_Track_ZOD.parse(data);
            } catch (error: any) {
                return new Response("Bad request", { status: 400 });
            }

            try {

                const init = await TrackSaveDB(parsedZOD, user);

                await init.update(req.params.id);

                return Response.json({ id: req.params.id }, { status: 200 });

            } catch (error: any) {
                console.error("erreur", error.message)

                if (error instanceof ErrorHandled) {
                    return new Response(JSON.stringify({ error: error.message }), { status: 502 });
                }
                return new Response("Server error", { status: 502 });
            }

            return new Response(JSON.stringify({ data: "Ok" }), { status: 200 });
        })
}