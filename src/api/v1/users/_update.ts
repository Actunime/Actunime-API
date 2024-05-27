import { UserDisabledModel, UserModel, UserPremiumModel } from "../../../_models";
import { CreateActivity } from "../../../_server-utils/activity";
import { ErrorHandled } from "../../../_server-utils/errorHandling";
import { RestrictedAPIRoute } from "../../../_server-utils/restricted";
import { ArrayCheckChanged, ObjCheckChanged } from "../../../_utils/objectChecker";
import { userPermissionIsHigherThan } from "../../../_utils/userUtil";
import { IUser_Update_ZOD, User_Update_ZOD } from "../../../_validation/userZOD";
import { FastifyRequest } from "fastify";

export async function Update(req: FastifyRequest<{ Params: { id: string }, Body: IUser_Update_ZOD }>) {
    return RestrictedAPIRoute("ADMINISTRATOR",
        () => new Response(JSON.stringify({ error: "Vous n'etes pas autorisé." }), { status: 401 }),
        async (user) => {
            let data;
            let parsedZOD: IUser_Update_ZOD;

            try {
                data = req.body;
                parsedZOD = User_Update_ZOD.parse(data);
            } catch (error: any) {
                return new Response("Bad request", { status: 400 });
            }

            try {

                const findUser = await UserModel.findOne({ id: req.params.id });
                if (!findUser)
                    throw new ErrorHandled("Aucun utilisateur avec cet identifiant");

                const { rolesChanges, disableUser, enableUser, updatePremium } = parsedZOD;

                if (rolesChanges) {
                    const { added, removed, changed } = ArrayCheckChanged(findUser.roles, rolesChanges);

                    if (!changed)
                        throw new ErrorHandled("Les rôles n'ont pas été modifiés ?");

                    if (added.length > 0) {
                        if (added.includes("ACTUNIME"))
                            throw new ErrorHandled("Vous ne pouvez pas ajouter ou modifier le rôle ACTUNIME");

                        if (userPermissionIsHigherThan(added, user.roles))
                            throw new ErrorHandled("Vous rôles actuel ne permettent pas d'ajouter ce ou ces rôles.");

                        await findUser.updateOne({ roles: findUser.roles.concat(added) }, { runValidators: true });
                    }

                    if (removed.length > 0) {
                        if (added.includes("ACTUNIME"))
                            throw new ErrorHandled("Vous ne pouvez pas ajouter ou modifier le rôle ACTUNIME");

                        if (userPermissionIsHigherThan(removed, user.roles))
                            throw new ErrorHandled("Vous rôles actuel ne permettent pas de retirer ce ou ces rôles.");

                        await findUser.updateOne({ roles: findUser.roles.filter(x => !removed.includes(x)) }, { runValidators: true });
                    }

                    await CreateActivity("MODERATION", "ROLES_CHANGES", {
                        author: {
                            id: user.id,
                        },
                        target: {
                            id: req.params.id
                        },
                        targetPath: "User"
                    })
                }

                if (disableUser) {
                    if (userPermissionIsHigherThan(findUser.roles, user.roles))
                        throw new ErrorHandled("Vous n'avez pas les permissions nécéssaires pour désactiver cet utilisateur");

                    await UserDisabledModel.findOneAndUpdate({
                        "user.id": findUser.id
                    }, {
                        reason: disableUser.reason,
                        by: {
                            id: user.id
                        }
                    }, { upsert: true, runValidators: true });


                    await CreateActivity("MODERATION", "DISABLE_MEMBER", {
                        author: {
                            id: user.id,
                        },
                        target: {
                            id: req.params.id
                        },
                        targetPath: "User"
                    })
                }

                if (enableUser) {
                    if (userPermissionIsHigherThan(findUser.roles, user.roles))
                        throw new ErrorHandled("Vous n'avez pas les permissions nécéssaires pour re-activer cet utilisateur");

                    await UserDisabledModel.findOneAndDelete({
                        "user.id": findUser.id
                    });

                    await CreateActivity("MODERATION", "ENABLE_MEMBER", {
                        author: {
                            id: user.id,
                        },
                        target: {
                            id: req.params.id
                        },
                        targetPath: "User"
                    })
                }

                if (updatePremium) {
                    await findUser.populate('premium');

                    const { changes } = ObjCheckChanged({
                        level: findUser.premium?.level,
                        expires: findUser.premium?.expires
                    }, updatePremium);

                    if (changes) {
                        await UserPremiumModel.findOneAndUpdate({
                            "user.id": findUser.id
                        }, changes, {
                            upsert: true, runValidators: true
                        })
                    }
                }

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