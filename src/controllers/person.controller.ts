import { ClientSession } from 'mongoose';
import { APIError } from '../_lib/error';
import {
  IPerson,
  IUser,
  ITargetPath,
  IPersonPaginationResponse,
} from '@actunime/types';
import {
  IPersonBody,
  IMediaDeleteBody,
  IPersonCreateBody,
  IPersonPaginationBody,
  IPersonAddBody,
} from '@actunime/validations';
import { UtilControllers } from '../_utils/_controllers';
import { DevLog } from '../_lib/logger';
import { genPublicID } from '@actunime/utils';
import { ImageController } from './image.controller';
import LogSession from '../_utils/_logSession';
import { Person } from '../_lib/media/_person';
import { Patch } from '../_lib/media';
import { PersonModel } from '../_lib/models';
import { PaginationControllers } from './pagination.controllers';

class PersonController extends UtilControllers.withUser {
  private targetPath: ITargetPath = 'Person';

  constructor(
    session?: ClientSession | null,
    options?: { log?: LogSession; user?: IUser }
  ) {
    super({ session, ...options });
  }

  async pagination(
    pageFilter?: Partial<IPersonPaginationBody>
  ): Promise<IPersonPaginationResponse> {
    DevLog(`Pagination des persons...`, 'debug');
    const pagination = new PaginationControllers(PersonModel);

    pagination.useFilter(pageFilter);

    const res = await pagination.getResults();
    res.results = res.results.map((result) => new Person(result).toJSON());

    DevLog(`Persons trouvées: ${res.resultsCount}`, 'debug');
    return res;
  }

  async build(
    input: IPersonBody,
    params: { refId: string; isRequest: boolean; personId?: string }
  ) {
    const { avatar, ...rawPerson } = input;
    const person: Partial<IPerson> & { id: string } = {
      ...rawPerson,
      id: params.personId || genPublicID(8),
      isVerified: false,
    };

    const session = this.session;
    this.needSession(session);
    if (params?.personId) {
      // Vérification que l'anime existe;
      const get = await Person.get(params.personId, {
        cache: '5s',
        nullThrowErr: true,
        session,
      });
      // Valeur a synchroniser;
      person.isVerified = get.isVerified;
    }

    const user = this.user;
    this.needUser(user);
    const { refId, isRequest } = params;
    DevLog(`Build de la personne...`, 'debug');

    const imageController = new ImageController(session, {
      user,
      log: this.log,
    });
    const imageData = await imageController.add(
      avatar,
      refId,
      isRequest,
      { id: person.id },
      this.targetPath
    );

    if (imageData) person.avatar = { id: imageData.id };

    return new Person(person, this.session);
  }

  public async add(
    item: IPersonAddBody | undefined,
    refId: string,
    isRequest: boolean
  ) {
    const session = this.session;
    if (item?.id) {
      const get = await Person.get(item.id, {
        nullThrowErr: true,
        session,
      });
      return { id: get.id };
    } else if (item?.newPerson) {
      if (isRequest) {
        const { data, patch } = await this.create_request(item.newPerson!, {
          refId,
        });
        return { id: data.id, role: item.role, patch };
      } else {
        const { data, patch } = await this.create(item.newPerson!, {
          refId,
        });
        return { id: data.id, role: item.role, patch };
      }
    } else if (item)
      throw new APIError(
        'Vous devez fournir une personne valide',
        'BAD_REQUEST'
      );
    return;
  }

  public async bulkAdd(
    persons: IPersonAddBody[] | undefined,
    refId: string,
    isRequest: boolean
  ) {
    if (!persons?.length) return undefined;
    const items = await Promise.all(
      persons.map(async (person) => this.add(person, refId, isRequest))
    );
    return {
      items: items
        .filter((data) => data?.id)
        .map((data) => ({ id: data!.id, role: data!.role })),
      patchs: items.filter((data) => data?.patch).map((data) => data!.patch!),
    };
  }

  public async create(
    data: IPersonCreateBody['data'],
    params: Omit<IPersonCreateBody, 'data'> & { refId?: string }
  ) {
    DevLog("Création de l'person...", 'debug');
    this.needUser(this.user);
    this.needSession(this.session);
    const patchID = genPublicID(8);
    const build = await this.build(data, { refId: patchID, isRequest: false });
    build.setVerified();

    const newPatch = new Patch(
      {
        ...(params.refId && { ref: { id: params.refId } }),
        id: patchID,
        type: 'CREATE',
        author: { id: this.user.id },
        target: build.asRelation(),
        targetPath: this.targetPath,
        original: build.toJSON(),
        status: 'ACCEPTED',
        description: params.description,
        moderator: { id: this.user.id },
      },
      this.session
    );

    await newPatch.save({ nullThrowErr: true });

    this.log?.add("Création d'un person", [
      { name: 'Nom', content: build.name.default },
      { name: 'ID', content: build.id },
      { name: 'MajID', content: patchID },
      { name: 'Description', content: params.description },
      {
        name: 'Modérateur',
        content: `${this.user.username} (${this.user.id})`,
      },
    ]);

    const saved = await build.save({ nullThrowErr: true });

    DevLog(
      `Person créé... ID Person: ${saved.id}, ID Maj: ${patchID}`,
      'debug'
    );

    return {
      patch: newPatch.toJSON(),
      data: saved,
    };
  }

  public async update(
    id: string,
    data: IPersonCreateBody['data'],
    params: Omit<IPersonCreateBody, 'data'> & { refId?: string }
  ) {
    DevLog("Mise à jour de l'person...", 'debug');
    this.needUser(this.user);
    this.needSession(this.session);
    const patchID = genPublicID(8);
    const build = await this.build(data, {
      refId: patchID,
      isRequest: false,
      personId: id,
    });
    const { original, changes } = await build.getDBDiff();

    console.log('changements', changes);

    if (!changes || (changes && !changes.length))
      throw new APIError("Aucun changement n'a été détecté !", 'EMPTY_CHANGES');

    const newPatch = new Patch(
      {
        ...(params.refId && { ref: { id: params.refId } }),
        id: patchID,
        type: 'UPDATE',
        author: { id: this.user.id },
        target: build.asRelation(),
        targetPath: this.targetPath,
        original,
        changes,
        status: 'ACCEPTED',
        description: params.description,
        moderator: { id: this.user.id },
      },
      this.session
    );

    await newPatch.save({ nullThrowErr: true });

    this.log?.add("Modification d'un person", [
      { name: 'Nom', content: build.name.default },
      { name: 'ID', content: build.id },
      { name: 'MajID', content: patchID },
      { name: 'Description', content: params.description },
      {
        name: 'Modérateur',
        content: `${this.user.username} (${this.user.id})`,
      },
    ]);

    const updated = await build.update({ nullThrowErr: true });

    DevLog(
      `Person mis à jour, ID Person: ${build.id}, ID Maj: ${patchID}`,
      'debug'
    );

    return {
      patch: newPatch.toJSON(),
      data: updated,
    };
  }

  public async delete(id: string, params: IMediaDeleteBody) {
    DevLog("Suppression de l'person...", 'debug');
    this.needUser(this.user);
    this.needSession(this.session);
    const media = await Person.get(id, {
      json: false,
      nullThrowErr: true,
      session: this.session,
    });
    const deleted = await media.delete({ nullThrowErr: true });
    const patchID = genPublicID(8);

    if (media.isVerified) {
      // Créez un patch que si l'person était un person vérifié;
      const newPatch = new Patch(
        {
          id: patchID,
          type: 'DELETE',
          author: { id: this.user.id },
          target: media.asRelation(),
          targetPath: this.targetPath,
          original: media.toJSON(),
          status: 'ACCEPTED',
          reason: params.reason,
          moderator: { id: this.user.id },
        },
        this.session
      );

      await newPatch.save({ nullThrowErr: true });

      this.log?.add("Suppresion d'un person", [
        { name: 'Nom', content: media.name.default },
        { name: 'ID', content: media.id },
        { name: 'Raison', content: params.reason },
        {
          name: 'Modérateur',
          content: `${this.user.username} (${this.user.id})`,
        },
      ]);

      DevLog(
        `Person supprimé, ID Person: ${media.id}, ID Maj: ${patchID}`,
        'debug'
      );

      return {
        patch: newPatch.toJSON(),
        data: deleted,
      };
    }

    DevLog(
      `Person non supprimé ou inexistant ou bug ???, ID Person: ${media.id}`,
      'debug'
    );

    return {
      data: deleted,
    };
  }

  public async verify(id: string) {
    DevLog("Verification de l'person...", 'debug');
    const media = await Person.get(id, {
      json: false,
      nullThrowErr: true,
      session: this.session,
    });
    await media.setVerified(true);
    DevLog(`Person verifié, ID Person: ${media.id}`, 'debug');
    return media.toJSON();
  }

  public async unverify(id: string) {
    DevLog("Verification de l'person...", 'debug');
    const media = await Person.get(id, {
      json: false,
      nullThrowErr: true,
      session: this.session,
    });
    await media.setUnverified(true);
    DevLog(`Person non verifié, ID Person: ${media.id}`, 'debug');
    return media.toJSON();
  }

  public async create_request(
    data: IPersonCreateBody['data'],
    params: Omit<IPersonCreateBody, 'data'> & { refId?: string }
  ) {
    DevLog("Demande de création d'un person...", 'debug');
    this.needUser(this.user);
    const patchID = genPublicID(8);
    const build = await this.build(data, { refId: patchID, isRequest: true });
    build.setUnverified();

    const newPatch = new Patch(
      {
        ...(params.refId && { ref: { id: params.refId } }),
        id: patchID,
        type: 'CREATE',
        author: { id: this.user.id },
        target: build.asRelation(),
        targetPath: this.targetPath,
        original: build.toJSON(),
        status: 'PENDING',
        description: params.description,
      },
      this.session
    );

    await newPatch.save({ nullThrowErr: true });
    await build.save({ nullThrowErr: true });

    this.log?.add("Demande de création d'un person", [
      { name: 'Nom', content: build.name.default },
      { name: 'ID', content: build.id },
      { name: 'MajID', content: patchID },
      { name: 'Description', content: params.description },
      {
        name: 'Modérateur',
        content: `${this.user.username} (${this.user.id})`,
      },
    ]);

    DevLog(
      `Person créé, Demande crée... ID Person: ${build.id}, ID Demande: ${patchID}`,
      'debug'
    );

    return {
      patch: newPatch.toJSON(),
      data: build.toJSON(),
    };
  }

  public async update_request(
    id: string,
    data: IPersonCreateBody['data'],
    params: Omit<IPersonCreateBody, 'data'> & { refId?: string }
  ) {
    DevLog("Demande de modification d'un person...", 'debug');
    this.needUser(this.user);
    const patchID = genPublicID(8);
    const build = await this.build(data, {
      refId: patchID,
      isRequest: true,
      personId: id,
    });
    const { changes } = await build.getDBDiff();
    console.log('changements', changes);

    if (!changes || (changes && !changes.length))
      throw new APIError("Aucun changement n'a été détecté !", 'EMPTY_CHANGES');

    const newPatch = new Patch(
      {
        ...(params.refId && { ref: { id: params.refId } }),
        id: patchID,
        type: 'UPDATE',
        author: { id: this.user.id },
        target: build.asRelation(),
        targetPath: this.targetPath,
        changes,
        status: 'PENDING',
        description: params.description,
      },
      this.session
    );

    await newPatch.save({ nullThrowErr: true });

    this.log?.add("Demande de modification d'un person", [
      { name: 'Nom', content: build.name.default },
      { name: 'ID', content: build.id },
      { name: 'MajID', content: patchID },
      { name: 'Description', content: params.description },
      {
        name: 'Modérateur',
        content: `${this.user.username} (${this.user.id})`,
      },
    ]);

    DevLog(
      `Demande crée, ID Person: ${build.id}, ID Demande: ${patchID}`,
      'debug'
    );

    return {
      patch: newPatch.toJSON(),
      data: build.toJSON(),
    };
  }

  public async update_patch(
    personID: string,
    patchID: string,
    data: IPersonCreateBody['data'],
    params: Omit<IPersonCreateBody, 'data'>
  ) {
    DevLog(
      "Modification d'une demande de modification d'un person...",
      'debug'
    );
    this.needUser(this.user);
    const request = await Patch.get(patchID, {
      nullThrowErr: true,
      json: false,
      session: this.session,
    });
    if (!request.isPending())
      throw new APIError(
        'Vous pouvez modifier que les demandes en attente',
        'BAD_REQUEST'
      );

    if (!request.targetIdIs(personID))
      throw new APIError(
        "L'identifiant de l'person n'est pas celui qui est lié a la requête",
        'BAD_REQUEST'
      );

    const newPatchData = await this.build(data, {
      refId: request.id,
      isRequest: true,
      personId: personID,
    });

    const { changes } = await newPatchData.getDBDiff();
    if (!changes)
      throw new APIError("Aucun changement n'a été détecté !", 'EMPTY_CHANGES');

    // Création du PATCH de modification pour un suivi en status ACCEPTED pour un suivi;
    const newPatch = new Patch(
      {
        type: 'UPDATE',
        author: { id: this.user.id },
        moderator: { id: this.user.id },
        target: request.asRelation(),
        targetPath: 'Patch',
        original: request.changes, // Spécial
        changes,
        status: 'ACCEPTED',
        description: params.description,
      },
      this.session
    );

    await newPatch.save({ nullThrowErr: true });

    const newRequest = await request.update({
      set: { changes, isChangesUpdated: true },
      nullThrowErr: true,
    });

    DevLog(
      `Demande modifiée, ID Person: ${personID}, ID Demande: ${newRequest.id}`,
      'debug'
    );

    return {
      patch: newPatch.toJSON(),
      data: newPatchData.toJSON(),
    };
  }

  public async delete_patch(
    personID: string,
    patchID: string
    // params: IMediaDeleteBody
  ) {
    DevLog("Suppression d'une demande de modification d'un person...", 'debug');
    this.needUser(this.user);
    const request = await Patch.get(patchID, {
      nullThrowErr: true,
      json: false,
      session: this.session,
    });

    if (!request.targetIdIs(personID))
      throw new APIError(
        "L'identifiant de l'person n'est pas celui qui est lié a la requête",
        'BAD_REQUEST'
      );

    const deleted = await request.delete({ nullThrowErr: true });

    // Gérer le reccursive
    // if (params.deleteTarget)
    //     await this.delete(request.target.id, params, ["PERSON_REQUEST_DELETE"]);

    DevLog(
      `Demande supprimée (${deleted}), ID Person: ${request.target.id}, ID Demande: ${request.id}`,
      'debug'
    );

    return {
      patch: deleted,
    };
  }

  public async accept_patch(
    personID: string,
    patchID: string
    // params: IMediaVerifyBody
  ) {
    DevLog("Acceptation d'une demande de modification d'un person...", 'debug');
    this.needUser(this.user);
    const patch = await Patch.get(patchID, {
      nullThrowErr: true,
      json: false,
    });

    if (!patch.targetIdIs(personID))
      throw new APIError(
        "L'identifiant de l'person n'est pas celui qui est lié a la requête",
        'BAD_REQUEST'
      );

    if (!patch.isPending())
      throw new APIError(
        'Vous ne pouvez pas accepter cette requête',
        'FORBIDDEN'
      );

    if (!patch.isCreate() && !patch.isUpdate())
      throw new APIError(
        'Vous ne pouvez pas accepter cette requête',
        'FORBIDDEN'
      );

    const target = await Person.get(patch.target.id, {
      nullThrowErr: true,
      json: false,
      session: this.session,
    });

    let newData: IPerson;
    if (patch.isCreate()) {
      if (patch.changes) {
        DevLog(
          `Le patch contient des changements qui vont être appliqués`,
          'debug'
        );
        newData = patch.getChangedFromDiff(target.toJSON(), patch.changes);
        await target.update({ set: newData });
      } else {
        DevLog(`Le patch ne contient aucun changement |...`, 'debug');
        newData = target.toJSON();
      }
    } else {
      if (patch.changes && patch.isUpdate()) {
        DevLog(
          `Le patch contient des changements qui vont être appliqués`,
          'debug'
        );
        newData = patch.getChangedFromDiff(target.toJSON(), patch.changes);
        await target.update({ set: newData });
      } else {
        throw new APIError(
          'Aucun changement sur le patch ???',
          'EMPTY_CHANGES'
        );
      }
    }

    const newPatch = await patch.update({
      set: { status: 'ACCEPTED' },
      nullThrowErr: true,
    });

    DevLog(
      `Demande acceptée, ID Person: ${newPatch.target.id}, ID Demande: ${newPatch.id}`,
      'debug'
    );

    return {
      patch: newPatch,
      data: newData,
    };
  }

  public async reject_patch(
    personID: string,
    patchID: string
    // params: IMediaVerifyBody
  ) {
    DevLog("Refus d'une demande de modification d'un person...", 'debug');
    this.needUser(this.user);
    this.needSession(this.session);
    const patch = await Patch.get(patchID, {
      nullThrowErr: true,
      json: false,
    });

    if (!patch.targetIdIs(personID))
      throw new APIError(
        "L'identifiant de l'person n'est pas celui qui est lié a la requête",
        'BAD_REQUEST'
      );

    if (!patch.isPending())
      throw new APIError(
        'Vous ne pouvez pas accepter cette requête',
        'FORBIDDEN'
      );

    if (!patch.isCreate() && !patch.isUpdate())
      throw new APIError(
        'Vous ne pouvez pas accepter cette requête',
        'FORBIDDEN'
      );

    const target = await Person.get(patch.target.id, {
      nullThrowErr: true,
      json: false,
    });

    if (patch.type === 'CREATE') {
      // Suppression de l'person qui a été crée automatiquement dans le cadre de la demande;
      await target.delete({ nullThrowErr: true, session: this.session });
      // gérer le reccursive
    }

    // Gérer le reccursive
    // if (params.reccursive)
    //     await this.patchController.acceptPatchReferences(patch.id, params);

    const newPatch = await patch.update({
      set: { status: 'REJECTED' },
      nullThrowErr: true,
    });

    DevLog(
      `Demande refusée, ID Person: ${newPatch.target.id}, ID Demande: ${newPatch.id}`,
      'debug'
    );

    return {
      patch: newPatch,
      data: target.toJSON(),
    };
  }
}

export { PersonController };
