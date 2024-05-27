

import { MangaSaveDB } from "../../../_server-utils/manga";
import { ErrorHandled } from "../../../_server-utils/errorHandling";
import { RestrictedAPIRoute } from "../../../_server-utils/restricted";
import { Create_Manga_ZOD, ICreate_Manga_ZOD } from "../../../_validation/mangaZOD";
import { FastifyRequest } from "fastify";

export function Create(req: FastifyRequest<{ Body: ICreate_Manga_ZOD }>) {
    return RestrictedAPIRoute("MANGA_MODERATOR",
        () => new Response("Vous n'etes pas autorisé.", { status: 401 }),
        async (user) => {
            let data: ICreate_Manga_ZOD;

            try {
                data = await req.body;
                data = Create_Manga_ZOD.parse(data);
            } catch (error: any) {
                return new Response("Bad request", { status: 400 });
            }

            try {

                const init = await MangaSaveDB(data, user);
                await init.create();

            } catch (error: any) {
                console.error("erreur", error.message)

                if (error instanceof ErrorHandled) {
                    return new Response(JSON.stringify({ error: error.message }), { status: 502 });
                }

                return new Response("Server error", { status: 502 });
            }

        }
    )
}