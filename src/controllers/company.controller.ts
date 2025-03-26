import { ClientSession } from 'mongoose';
import {
  ICompany,
  ICompanyPaginationResponse,
  IMediaRelation,
  IPatch,
  ITargetPath,
  IUser,
} from '@actunime/types';
import {
  ICompanyAddBody,
  ICompanyBody,
  ICompanyCreateBody,
  ICompanyPaginationBody,
  IMediaDeleteBody,
} from '@actunime/validations';
import { UtilControllers } from '../_utils/_controllers';
import { DevLog } from '../_lib/logger';
import { genPublicID } from '@actunime/utils';
import { ImageController } from './image.controller';
import LogSession from '../_utils/_logSession';
import { CompanyModel } from '../_lib/models';
import { APIError } from '../_lib/error';
import { Patch } from '../_lib/media';
import { Company } from '../_lib/media/_company';
import { PaginationControllers } from './pagination.controllers';

class CompanyController extends UtilControllers.withUser {
  private targetPath: ITargetPath = 'Company';

  constructor(
    session?: ClientSession | null,
    options?: { log?: LogSession; user?: IUser }
  ) {
    super({ session, ...options });
  }

  async pagination(
    pageFilter?: Partial<ICompanyPaginationBody>
  ): Promise<ICompanyPaginationResponse> {
    DevLog(`Pagination des companys...`, 'debug');
    const pagination = new PaginationControllers(CompanyModel);

    pagination.useFilter(pageFilter);

    const res = await pagination.getResults();
    res.results = res.results.map((result) => new Company(result).toJSON());

    DevLog(`Companys trouvées: ${res.resultsCount}`, 'debug');
    return res;
  }

  async build(
    input: ICompanyBody,
    params: { refId: string; isRequest: boolean; companyId?: string }
  ) {
    const { logo, ...rawCompany } = input;
    const company: Partial<ICompany> & { id: string } = {
      ...rawCompany,
      id: params.companyId || genPublicID(8),
      isVerified: false,
    };
    const session = this.session;
    this.needSession(session);
    if (params.companyId) {
      // Vérification existe;
      const get = await Company.get(params.companyId, {
        cache: '5s',
        nullThrowErr: true,
        session,
      });
      // Valeur a synchroniser;
      company.isVerified = get.isVerified;
    }
    const user = this.user;
    this.needUser(user);

    const { refId, isRequest } = params;

    DevLog(`Build d'une société...`, 'debug');

    const imageController = new ImageController(session, {
      user,
      log: this.log,
    });

    const coverData = await imageController.add(
      logo,
      refId,
      isRequest,
      { id: company.id },
      this.targetPath
    );

    if (coverData) company.logo = { id: coverData.id };

    return new Company(company, this.session);
  }

  public async add(
    item: ICompanyAddBody | undefined,
    refId: string,
    isRequest: boolean
  ) {
    DevLog(`Comany ADD ${JSON.stringify(item)}`, 'debug');
    if (item?.id) {
      const session = this.session;
      this.needSession(session);
      const get = await Company.get(item.id, {
        nullThrowErr: true,
        session,
      });
      return { id: get.id };
    } else if (item?.newCompany) {
      if (isRequest) {
        const { data, patch } = await this.create_request(item.newCompany!, {
          refId,
        });
        return { id: data.id, patch };
      } else {
        const { data, patch } = await this.create(item.newCompany!, {
          refId,
        });
        return { id: data.id, patch };
      }
    } else if (item)
      throw new APIError(
        'Vous devez fournir une société valide',
        'BAD_REQUEST'
      );
    return;
  }

  public async bulkAdd(
    companys: ICompanyAddBody[] | undefined,
    refId: string,
    isRequest: boolean
  ) {
    if (!companys?.length) return undefined;
    const items: IMediaRelation[] = [];
    const patchs: IPatch[] = [];
    DevLog(`Ajout de ${companys.length} sociétées...`, 'debug');
    for (const company of companys) {
      const data = await this.add(company, refId, isRequest);
      if (data?.id) items.push({ id: data.id });
      if (data?.patch) patchs.push(data.patch);
    }
    return { items, patchs };
  }

  public async create(
    data: ICompanyCreateBody['data'],
    params: Omit<ICompanyCreateBody, 'data'> & { refId?: string }
  ) {
    DevLog("Création de l'company...", 'debug');
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

    this.log?.add("Création d'un company", [
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
      `Company créé... ID Company: ${saved.id}, ID Maj: ${patchID}`,
      'debug'
    );
    return {
      patch: newPatch.toJSON(),
      data: saved,
    };
  }

  public async update(
    id: string,
    data: ICompanyCreateBody['data'],
    params: Omit<ICompanyCreateBody, 'data'> & { refId?: string }
  ) {
    DevLog("Mise à jour de l'company...", 'debug');
    this.needUser(this.user);
    this.needSession(this.session);
    const patchID = genPublicID(8);
    const build = await this.build(data, {
      refId: patchID,
      isRequest: false,
      companyId: id,
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

    this.log?.add("Modification d'un company", [
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
      `Company mis à jour, ID Company: ${build.id}, ID Maj: ${patchID}`,
      'debug'
    );

    return {
      patch: newPatch.toJSON(),
      data: updated,
    };
  }

  public async delete(id: string, params: IMediaDeleteBody) {
    DevLog("Suppression de l'company...", 'debug');
    this.needUser(this.user);
    this.needSession(this.session);
    const media = await Company.get(id, {
      json: false,
      nullThrowErr: true,
      session: this.session,
    });
    const deleted = await media.delete({ nullThrowErr: true });
    const patchID = genPublicID(8);

    if (media.isVerified) {
      // Créez un patch que si l'company était un company vérifié;
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

      this.log?.add("Suppresion d'un company", [
        { name: 'Nom', content: media.name.default },
        { name: 'ID', content: media.id },
        { name: 'Raison', content: params.reason },
        {
          name: 'Modérateur',
          content: `${this.user.username} (${this.user.id})`,
        },
      ]);

      DevLog(
        `Company supprimé, ID Company: ${media.id}, ID Maj: ${patchID}`,
        'debug'
      );

      return {
        patch: newPatch.toJSON(),
        data: deleted,
      };
    }

    DevLog(
      `Company non supprimé ou inexistant ou bug ???, ID Company: ${media.id}`,
      'debug'
    );

    return {
      data: deleted,
    };
  }

  public async verify(id: string) {
    DevLog("Verification de l'company...", 'debug');
    const media = await Company.get(id, {
      json: false,
      nullThrowErr: true,
      session: this.session,
    });
    await media.setVerified(true);
    DevLog(`Company verifié, ID Company: ${media.id}`, 'debug');
    return media.toJSON();
  }

  public async unverify(id: string) {
    DevLog("Verification de l'company...", 'debug');
    const media = await Company.get(id, {
      json: false,
      nullThrowErr: true,
      session: this.session,
    });
    await media.setUnverified(true);
    DevLog(`Company non verifié, ID Company: ${media.id}`, 'debug');
    return media.toJSON();
  }

  public async create_request(
    data: ICompanyCreateBody['data'],
    params: Omit<ICompanyCreateBody, 'data'> & { refId?: string }
  ) {
    DevLog("Demande de création d'un company...", 'debug');
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

    this.log?.add("Demande de création d'un company", [
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
      `Company créé, Demande crée... ID Company: ${build.id}, ID Demande: ${patchID}`,
      'debug'
    );

    return {
      patch: newPatch.toJSON(),
      data: build.toJSON(),
    };
  }

  public async update_request(
    id: string,
    data: ICompanyCreateBody['data'],
    params: Omit<ICompanyCreateBody, 'data'> & { refId?: string }
  ) {
    DevLog("Demande de modification d'un company...", 'debug');
    this.needUser(this.user);
    const patchID = genPublicID(8);
    const build = await this.build(data, {
      refId: patchID,
      isRequest: true,
      companyId: id,
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

    this.log?.add("Demande de modification d'un company", [
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
      `Demande crée, ID Company: ${build.id}, ID Demande: ${patchID}`,
      'debug'
    );

    return {
      patch: newPatch.toJSON(),
      data: build.toJSON(),
    };
  }

  public async update_patch(
    companyID: string,
    patchID: string,
    data: ICompanyCreateBody['data'],
    params: Omit<ICompanyCreateBody, 'data'>
  ) {
    DevLog(
      "Modification d'une demande de modification d'un company...",
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

    if (!request.targetIdIs(companyID))
      throw new APIError(
        "L'identifiant de l'company n'est pas celui qui est lié a la requête",
        'BAD_REQUEST'
      );

    const newPatchData = await this.build(data, {
      refId: request.id,
      isRequest: true,
      companyId: companyID,
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
      `Demande modifiée, ID Company: ${companyID}, ID Demande: ${newRequest.id}`,
      'debug'
    );

    return {
      patch: newPatch.toJSON(),
      data: newPatchData.toJSON(),
    };
  }

  public async delete_patch(
    companyID: string,
    patchID: string
    // params: IMediaDeleteBody
  ) {
    DevLog(
      "Suppression d'une demande de modification d'un company...",
      'debug'
    );
    this.needUser(this.user);
    const request = await Patch.get(patchID, {
      nullThrowErr: true,
      json: false,
      session: this.session,
    });

    if (!request.targetIdIs(companyID))
      throw new APIError(
        "L'identifiant de l'company n'est pas celui qui est lié a la requête",
        'BAD_REQUEST'
      );

    const deleted = await request.delete({ nullThrowErr: true });

    // Gérer le reccursive
    // if (params.deleteTarget)
    //     await this.delete(request.target.id, params, ["COMPANY_REQUEST_DELETE"]);

    DevLog(
      `Demande supprimée (${deleted}), ID Company: ${request.target.id}, ID Demande: ${request.id}`,
      'debug'
    );

    return {
      patch: request.toJSON(),
    };
  }

  public async accept_patch(
    companyID: string,
    patchID: string
    // params: IMediaVerifyBody
  ) {
    DevLog(
      "Acceptation d'une demande de modification d'un company...",
      'debug'
    );
    this.needUser(this.user);
    const patch = await Patch.get(patchID, {
      nullThrowErr: true,
      json: false,
    });

    if (!patch.targetIdIs(companyID))
      throw new APIError(
        "L'identifiant de l'company n'est pas celui qui est lié a la requête",
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

    const target = await Company.get(patch.target.id, {
      nullThrowErr: true,
      json: false,
      session: this.session,
    });

    let newData: ICompany;
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

    // if (params.reccursive)
    //   await this.patchController.acceptPatchReferences(patch.id, params);

    const newPatch = await patch.update({
      set: { status: 'ACCEPTED' },
      nullThrowErr: true,
    });

    DevLog(
      `Demande acceptée, ID Company: ${newPatch.target.id}, ID Demande: ${newPatch.id}`,
      'debug'
    );

    return {
      patch: newPatch,
      data: newData,
    };
  }

  public async reject_patch(
    companyID: string,
    patchID: string
    // params: IMediaVerifyBody
  ) {
    DevLog("Refus d'une demande de modification d'un company...", 'debug');
    this.needUser(this.user);
    this.needSession(this.session);
    const patch = await Patch.get(patchID, {
      nullThrowErr: true,
      json: false,
    });

    if (!patch.targetIdIs(companyID))
      throw new APIError(
        "L'identifiant de l'company n'est pas celui qui est lié a la requête",
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

    const target = await Company.get(patch.target.id, {
      nullThrowErr: true,
      json: false,
    });

    if (patch.type === 'CREATE') {
      // Suppression de l'company qui a été crée automatiquement dans le cadre de la demande;
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
      `Demande refusée, ID Company: ${newPatch.target.id}, ID Demande: ${newPatch.id}`,
      'debug'
    );

    return {
      patch: newPatch,
    };
  }
}

export { CompanyController };
