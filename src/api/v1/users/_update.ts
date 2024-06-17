import { UserDisabledModel, UserModel, UserPremiumModel } from '../../../_models';
import { CreateActivity } from '../../../_server-utils/activity';
import { ErrorHandled } from '../../../_server-utils/errorHandling';
import { DevLog } from '../../../_utils/logUtil';
import { ArrayCheckChanged, ObjCheckChanged } from '../../../_utils/objectChecker';
import { userPermissionIsHigherThan } from '../../../_utils/userUtil';
import { IUser_Update_ZOD, User_Update_ZOD } from '../../../_validation/userZOD';
import { FastifyReply, FastifyRequest } from 'fastify';

export async function Update(
  req: FastifyRequest<{ Params: { id: string }; Body: IUser_Update_ZOD }>,
  res: FastifyReply
) {
  const user = req.user;

  if (!user) throw new Error('user est requis mettre une restriction dans le index.ts du dossier');

  let data;
  let parsedZOD: IUser_Update_ZOD;

  DevLog(`Trigger update on user ${req.params.id} by ${user.id}`, 'debug');

  try {
    data = req.body;
    parsedZOD = User_Update_ZOD.parse(data);
  } catch (error: any) {
    DevLog(error, 'error');
    return new Response('Bad request', { status: 400 });
  }

  try {
    const findUser = await UserModel.findOne({ id: req.params.id });
    if (!findUser) {
      DevLog('User not found', 'error');
      throw new ErrorHandled('Aucun utilisateur avec cet identifiant');
    }

    const { rolesChanges, disableUser, enableUser, updatePremium } = parsedZOD;

    if (rolesChanges) {
      const { added, removed, changed } = ArrayCheckChanged(findUser.roles, rolesChanges);

      if (!changed) throw new ErrorHandled("Les rôles n'ont pas été modifiés ?");

      if (added.length > 0) {
        DevLog(`Rôle(s) a ajouter ${added.join(',')}`);

        if (added.includes('ACTUNIME'))
          throw new ErrorHandled('Vous ne pouvez pas ajouter ou modifier le rôle ACTUNIME');

        if (userPermissionIsHigherThan(added, user.roles!))
          throw new ErrorHandled("Vos rôles actuel ne permettent pas d'ajouter ce ou ces rôles.");

        await findUser.updateOne({ roles: findUser.roles.concat(added) }, { runValidators: true });

        DevLog(`Le(s) rôle(s) ${added.join(',')} a/ont été ajouté a l'utilisateur ${findUser.id}`);
      }

      if (removed.length > 0) {
        DevLog(`Rôle(s) à retirer ${removed.join(',')}`);

        if (added.includes('ACTUNIME'))
          throw new ErrorHandled('Vous ne pouvez pas ajouter ou modifier le rôle ACTUNIME');

        if (userPermissionIsHigherThan(removed, user.roles!))
          throw new ErrorHandled('Vos rôles actuel ne permettent pas de retirer ce ou ces rôles.');

        await findUser.updateOne(
          { roles: findUser.roles.filter((x) => !removed.includes(x)) },
          { runValidators: true }
        );

        DevLog(
          `Le(s) rôle(s) ${removed.join(',')} a/ont été retiré a l'utilisateur ${findUser.id}`
        );
      }

      await CreateActivity('MODERATION', 'ROLES_CHANGES', {
        author: {
          id: user.id
        },
        target: {
          id: req.params.id
        },
        targetPath: 'User'
      });
    } else if (disableUser) {
      if (userPermissionIsHigherThan(findUser.roles, user.roles!))
        throw new ErrorHandled(
          "Vous n'avez pas les permissions nécéssaires pour désactiver cet utilisateur"
        );

      await UserDisabledModel.findOneAndUpdate(
        {
          'user.id': findUser.id
        },
        {
          reason: disableUser.reason,
          by: {
            id: user.id
          }
        },
        { upsert: true, runValidators: true }
      );

      await CreateActivity('MODERATION', 'DISABLE_MEMBER', {
        author: {
          id: user.id
        },
        target: {
          id: req.params.id
        },
        targetPath: 'User'
      });
    } else if (enableUser) {
      if (userPermissionIsHigherThan(findUser.roles, user.roles!))
        throw new ErrorHandled(
          "Vous n'avez pas les permissions nécéssaires pour re-activer cet utilisateur"
        );

      await UserDisabledModel.findOneAndDelete({
        'user.id': findUser.id
      });

      await CreateActivity('MODERATION', 'ENABLE_MEMBER', {
        author: {
          id: user.id
        },
        target: {
          id: req.params.id
        },
        targetPath: 'User'
      });
    } else if (updatePremium) {
      await findUser.populate('premium');

      const { changes } = ObjCheckChanged(
        {
          level: findUser.premium?.level,
          expires: findUser.premium?.expires
        },
        updatePremium
      );

      if (changes) {
        await UserPremiumModel.findOneAndUpdate(
          {
            'user.id': findUser.id
          },
          changes,
          {
            upsert: true,
            runValidators: true
          }
        );
      }
    }

    return res.send({ id: req.params.id });
  } catch (error: any) {
    console.error('erreur', error);

    if (error instanceof ErrorHandled) {
      return new Response(JSON.stringify({ error: error.message }), { status: 502 });
    }
    return new Response('Server error', { status: 502 });
  }
}
