import {
  ICompany,
  ICompanyDB,
  IMediaLink,
  IMediaRelation,
  IDate,
  IMediaTitle,
  ICompanyPaginationResponse,
} from '@actunime/types';
import { ClientSession } from 'mongoose';
import { CompanyModel, ModelDoc } from '../models';
import { APIError } from '../error';
import { DevLog } from '../logger';
import { Output } from '../../_utils/_controllers';
import { mongooseCache } from '../database';
import DeepDiff from 'deep-diff';
import { ClassUtilSession, MethodOption } from './util';
import { ICompanyPaginationBody } from '@actunime/validations';
import { PaginationControllers } from '../../controllers/pagination.controllers';

type Out<
  J extends boolean,
  E extends boolean,
  A extends boolean = false
> = Output<ICompany, Company, J, E, A>;

export class Company extends ClassUtilSession implements ICompany {
  public type: 'STUDIO' | 'PRODUCER';
  public name: IMediaTitle;
  public description?: string;
  public links?: IMediaLink[];
  public logo?: IMediaRelation;
  public createdDate?: IDate;
  public id: string;
  public isVerified: boolean;

  constructor(
    data: Partial<ICompany | ICompanyDB | ModelDoc<ICompany>>,
    session: ClientSession | null = null
  ) {
    super(session);
    if (!data)
      throw new APIError('Company constructor data is empty', 'SERVER_ERROR');
    if (!data.type)
      throw new APIError('Company constructor type is empty', 'SERVER_ERROR');
    this.type = data.type;
    if (!data.name)
      throw new APIError('Company constructor name is empty', 'SERVER_ERROR');
    this.name = data.name;
    this.createdDate = data.createdDate;
    this.description = data.description;
    this.logo = data.logo;
    this.links = data.links;
    this.id = data.id;
    if (data.isVerified === undefined)
      throw new APIError(
        'Company constructor isVerified is empty',
        'SERVER_ERROR'
      );
    this.isVerified = data.isVerified;
  }

  Model() {
    return new CompanyModel(this.toJSON());
  }

  async save<J extends boolean = true, E extends boolean = false>(
    options?: MethodOption<J, E>
  ): Promise<Out<J, E>> {
    const {
      json = true,
      nullThrowErr = false,
      session = this.session,
    } = options || {};
    this.needSession(session);
    const saved = await this.Model().save({ session });
    if (!saved) {
      if (nullThrowErr)
        throw new APIError(
          `L'company avec l'id ${this.id} n'a pas pu etre sauvegardé`,
          'NOT_FOUND'
        );
      return null as Out<J, E>;
    }
    return (json ? this.toJSON() : this) as Out<J, E>;
  }

  async update<J extends boolean = true, E extends boolean = boolean>(
    options?: Omit<MethodOption<J, E>, 'cache'> & {
      upsert?: boolean;
      set?: Partial<ICompany>;
    }
  ): Promise<Out<J, E>> {
    const {
      json = true,
      nullThrowErr = false,
      session = this.session,
      set,
      upsert,
    } = options || {};
    this.needSession(session);
    const update = await Company.cache(
      CompanyModel.findOneAndUpdate(
        { id: this.id },
        set ? { $set: set } : this.toJSON(),
        { session, upsert, new: true, runValidators: true }
      ),
      this.id,
      false
    );

    if (!update) {
      if (nullThrowErr)
        throw new APIError(
          `L'company avec l'id ${this.id} n'a pas pu etre mis à jour`,
          'NOT_FOUND'
        );
      return null as Out<J, E>;
    }

    mongooseCache.clear(this.id);
    const company = new Company(update.toObject(), session);
    return (json ? company.toJSON() : company) as Out<J, E>;
  }

  async delete<J extends boolean = true, E extends boolean = false>(
    options: MethodOption<J, E>
  ): Promise<Out<J, E>> {
    const {
      json = true,
      nullThrowErr = false,
      session = this.session,
    } = options || {};
    this.needSession(session);
    const deleted = await CompanyModel.deleteOne({ id: this.id }, { session });
    if (!deleted.acknowledged || !deleted.deletedCount) {
      if (nullThrowErr)
        throw new APIError(
          `L'company avec l'id ${this.id} n'a pas pu etre supprimer`,
          'NOT_FOUND'
        );
      return null as Out<J, E>;
    }
    await mongooseCache.clear(this.id);
    return (json ? this.toJSON() : this) as Out<J, E>;
  }

  public async setVerified<J extends boolean = true, E extends boolean = false>(
    save?: boolean,
    updateOptions?: MethodOption<J, E>
  ) {
    this.isVerified = true;
    if (save)
      await this.update({ ...updateOptions, set: { isVerified: true } });
  }

  public async setUnverified<
    J extends boolean = true,
    E extends boolean = false
  >(save?: boolean, updateOptions?: MethodOption<J, E>) {
    this.isVerified = false;
    if (save)
      await this.update({ ...updateOptions, set: { isVerified: false } });
  }

  public asRelation() {
    return { id: this.id, path: 'Company' };
  }

  async getDBDiff() {
    const original = await Company.get(this.id, {
      cache: false,
      nullThrowErr: true,
    });
    const changes = DeepDiff.diff(original, this.toJSON());
    return { original, changes };
  }

  toJSON(): ICompany {
    return {
      type: this.type,
      name: this.name,
      createdDate: this.createdDate,
      description: this.description,
      logo: this.logo,
      links: this.links,
      id: this.id,
      isVerified: this.isVerified,
    };
  }

  static async get<J extends boolean = true, E extends boolean = false>(
    id: string,
    options?: MethodOption<J, E>
  ): Promise<Out<J, E>> {
    DevLog(`Récupération de l'company ID: ${id}`, 'debug');
    const {
      json = true,
      cache = true,
      nullThrowErr = false,
      session,
    } = options || {};
    const res = await Company.cache(
      CompanyModel.findOne({ id }, null, { session }),
      id,
      session ? false : cache
    );
    DevLog(
      `Company ${res ? 'trouvée' : 'non trouvée'}, ID Company: ${id}`,
      'debug'
    );

    if (res) {
      const company = new Company(res.toObject(), session);
      return (json ? company.toJSON() : company) as Out<J, E>;
    }

    if (nullThrowErr)
      throw new APIError(
        `L'company avec l'identifiant ${id} n'a pas été trouvée`,
        'NOT_FOUND'
      );

    return null as Out<J, E>;
  }

  static async search<J extends boolean = true, E extends boolean = false>(
    filter: Partial<ICompanyDB>,
    options?: MethodOption<J, E>
  ): Promise<Out<J, E, true>> {
    DevLog(`Recherche des companys...`, 'debug');
    const {
      json = true,
      cache = true,
      nullThrowErr = false,
      session,
    } = options || {};
    const res = await Company.cache(
      CompanyModel.find(filter, null, { session }),
      undefined,
      session ? false : cache
    );
    DevLog(`Companys trouvées: ${res.length}`, 'debug');

    if (res.length > 0) {
      return res.map((result) => {
        const company = new Company(result, session);
        return (json ? company.toJSON() : company) as Out<J, E>;
      }) as Out<J, E, true>;
    }

    if (nullThrowErr)
      throw new APIError(
        `La recherche des companys avec les filtre ${JSON.stringify(
          filter
        )} n'a pas renvoyé aucun resultat`,
        'NOT_FOUND'
      );

    return null as Out<J, E, true>;
  }

  static async pagination(
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
}
