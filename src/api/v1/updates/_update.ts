import { UpdateModel } from "../../../_models";
import { ErrorHandled } from "../../../_server-utils/errorHandling";
import { TargetPathSaveDB, getModelByTargetPath } from "../../../_server-utils/media";
import { RestrictedAPIRoute } from "../../../_server-utils/restricted";
import { IUpdateActionList } from "../../../_types/updateType";
import { ObjCheckChanged } from "../../../_utils/objectChecker";
import { IUpdate_Action_ZOD, Update_Action_ZOD } from "../../../_validation/updateZOD";
import { FastifyRequest } from "fastify";

export async function Update(req: FastifyRequest<{ Params: { id: string }, Body: IUpdate_Action_ZOD }>) {
    return RestrictedAPIRoute("MODERATOR",
        () => new Response(JSON.stringify({ error: "Vous n'etes pas autorisé." }), { status: 401 }),
        async (user) => {
            let actionZOD: IUpdate_Action_ZOD;

            try {
                const data = req.body;
                actionZOD = Update_Action_ZOD.parse(data);
            } catch (error: any) {
                return new Response("Bad request", { status: 400 });
            }

            try {

                const findUpdate = await UpdateModel.findOne({ id: req.params.id });
                if (!findUpdate) throw new ErrorHandled("Modification introuvable");

                const { label, note, changes } = actionZOD;
                const action: Partial<IUpdateActionList> = {
                    user: { id: user.id },
                    note,
                    label,
                    at: new Date(),
                }

                const targetModel = getModelByTargetPath(findUpdate.targetPath);
                const targetSaveDB = TargetPathSaveDB[findUpdate.targetPath as keyof typeof TargetPathSaveDB];

                switch (label) {

                    case "IN_PROGRESS":
                        // if (findUpdate.status !== "PENDING")
                        //     throw new ErrorHandled("La modification n'est plus en attente de vérification");

                        await findUpdate.updateOne({ status: "IN_PROGRESS", $push: { actions: action } }, { runValidators: true });
                        break;

                    case "CHANGE":
                        if (findUpdate.status !== "PENDING" && findUpdate.status !== "IN_PROGRESS")
                            throw new ErrorHandled("Le statut de la modification ne permet pas une modification de celle-ci");

                        if (!Object.keys(changes || {}).length)
                            throw new ErrorHandled("Aucune modification n'a été détectée");

                        const { changes: changedValues } = ObjCheckChanged(findUpdate.beforeChanges, { ...findUpdate.changes, ...changes, }, ["id", "_id"]);

                        if (!changedValues)
                            throw new ErrorHandled("Aucune modification n'a été détectée");

                        await findUpdate.updateOne({ changes: changedValues, $push: { actions: action } }, { runValidators: true });
                        break;

                    case "REJECT":
                        if (findUpdate.status === "ACCEPTED" || findUpdate.status === "REVERTED" || findUpdate.status === "REJECTED")
                            throw new ErrorHandled("Le statut de la modification ne permet pas un rejet de celle-ci");

                        await findUpdate.updateOne({ status: "REJECTED", $push: { actions: action } }, { runValidators: true });
                        break;

                    case "ACCEPT":
                        if (findUpdate.status === "ACCEPTED" || findUpdate.status === "REJECTED")
                            throw new ErrorHandled("Le statut de la modification ne permet pas l'acceptation de celle-ci");

                        if (!findUpdate.target)
                            throw new ErrorHandled("Le target n'existe pas");

                        const hydratedChanges = new targetModel(findUpdate.changes);
                        const targetPreCreated = await targetModel.findOne({ id: findUpdate.target.id });
                        if (!targetPreCreated)
                            throw new ErrorHandled("Le target n'existe pas");

                        const { changes: getChanges } = ObjCheckChanged(targetPreCreated.toJSON(), hydratedChanges.toJSON(), ["id", "_id"]);

                        if (getChanges)
                            console.log("Modifications détectées", getChanges);

                        switch (findUpdate.type) {
                            case "CREATE":
                                await targetPreCreated.updateOne({
                                    $set: {
                                        // Si des modifications ont été detectées depuis la création du pré-ajout, on les met à jour
                                        ...getChanges || {},
                                        isVerified: true
                                    }
                                },
                                    {
                                        runValidators: true
                                    });

                                break;
                            case "UPDATE":
                                const targetDB = await targetSaveDB(findUpdate.changes, user);
                                await targetDB.update(findUpdate.target.id, {
                                    withUpdate: false,
                                    withActivity: false,
                                    updateRef: findUpdate.id,
                                    // Passage de l'auteur original vers les autres médias qui ont été crée suite a cet modification.
                                    authorId: findUpdate.author.id
                                });
                                break;

                            default:
                                throw new ErrorHandled("Type d'action non reconnue/supporté");
                        }

                        await findUpdate.updateOne({ status: "ACCEPTED", $push: { actions: action } }, { runValidators: true });

                        break;

                    case "REVERT":
                        if (findUpdate.status === "ACCEPTED") {
                            const targetDB = await targetSaveDB(findUpdate.beforeChanges, user);
                            if (!findUpdate.target)
                                throw new ErrorHandled("Le target n'existe pas");

                            await targetDB.update(findUpdate.target.id, {
                                withUpdate: false,
                                withActivity: false,
                            });
                        } else {
                            throw new ErrorHandled("Vous ne pouvez pas annulé une modification qui n'a pas été accepté.");
                        }

                        await findUpdate.updateOne({ status: "REVERTED", $push: { actions: action } }, { runValidators: true });
                        break;

                    default:
                        throw new ErrorHandled("Action non reconnue/supporté");
                }


                return Response.json({ id: req.params.id }, { status: 200 });

            } catch (error: any) {
                console.error("erreur", error.message)

                if (error instanceof ErrorHandled) {
                    return new Response(JSON.stringify({ error: error.message }), { status: 502 });
                }
                return new Response("Server error", { status: 502 });
            }
        })
}