import { ClientSession, Document } from 'mongoose';
import { ICharacter } from '../_types/characterType';
import { IUser } from '../_types/userType';
import {
  IAdd_Character_ZOD,
  ICharacter_Pagination_ZOD,
  ICreate_Character_ZOD
} from '../_validation/characterZOD';
import { PersonManager } from './person';
import { PatchManager } from './patch';
import { CharacterModel } from '../_models';
import { getChangedData } from '../_utils/getObjChangeUtil';

import { MediaPagination } from './pagination';
import { IPaginationResponse } from '@/_types/paginationType';
import { ImageManager } from './image';
import { APIError } from './Error';

export class CharacterManager {
  private user?: IUser;
  private session: ClientSession;
  private newData!: Partial<ICharacter>;
  private avatarManager?: ImageManager;

  constructor(session: ClientSession, user?: IUser) {
    this.user = user;
    this.session = session;
  }

  private async populate(
    doc: Document | IPaginationResponse<ICharacter>,
    withMedia: ICharacter_Pagination_ZOD['with']
  ) {
    if (withMedia?.actors)
      await CharacterModel.populate(doc, {
        path: 'actors.data',
        select: '-_id',
        justOne: true,
        options: { session: this.session }
      });
  }

  public async get(id: string, withMedia?: ICharacter_Pagination_ZOD['with']) {
    const findCharacter = await CharacterModel.findOne({ id }, null, {
      session: this.session
    }).select('-_id');

    if (!findCharacter)
      throw new APIError('Aucun personnage avec cet identifiant', 'NOT_FOUND', 404);

    if (withMedia) await this.populate(findCharacter, withMedia);

    return findCharacter.toJSON();
  }

  public async filter(paginationInput: ICharacter_Pagination_ZOD) {
    const pagination = new MediaPagination({ model: CharacterModel });

    pagination.setPagination({ page: paginationInput.page, limit: paginationInput.limit });

    const query = paginationInput.query;
    const sort = paginationInput.sort;

    if (query?.name) {
      pagination.searchByName(query.name, 'name.first');
      pagination.searchByName(query.name, 'name.last');
    }

    if (paginationInput.strict) {
      pagination.setStrict(paginationInput.strict);
    } else if (query?.name)
      // Si c'est pas en strict chercher aussi dans les alias
      pagination.searchByName(query.name, 'name.alias');
    // Le strict risque de faire que les noms doivent correspondre tout les deux a la recherche

    if (sort) pagination.setSort(sort);

    const response = await pagination.getResults();

    if (paginationInput.with) await this.populate(response, paginationInput.with);

    return response;
  }

  public async init(data: Partial<ICreate_Character_ZOD>) {
    try {
      const {
        // Relations
        avatar,
        actors,
        // Data
        ...rawData
      } = data;
      this.newData = rawData as Partial<ICharacter>;

      const { newData, user, session } = this;

      if (actors)
        newData.actors = await new PersonManager(session, user).createMultipleRelation(actors);

      if (avatar) {
        this.avatarManager = new ImageManager(session, 'Character', user);
        newData.avatar = await this.avatarManager.createRelation(avatar);
      }

      return this;
    } catch (err) {
      await this.avatarManager?.deleteImageIfSaved();
      throw err;
    }
  }

  public async create(note?: string) {
    const newCharacter = new CharacterModel(this.newData);
    try {
      newCharacter.isVerified = true;
      await newCharacter.save({ session: this.session });

      await new PatchManager(this.session, this.user!).PatchCreate({
        type: 'CREATE',
        status: 'ACCEPTED',
        target: { id: newCharacter.id },
        note,
        targetPath: 'Character',
        newValues: newCharacter.toJSON(),
        oldValues: null,
        author: { id: this.user!.id }
      });

      return newCharacter;
    } catch (err) {
      await this.avatarManager?.deleteImageIfSaved();
      throw err;
    }
  }

  public async createRequest(note?: string) {
    try {
      const newCharacter = new CharacterModel(this.newData);

      newCharacter.isVerified = false;

      // Pré-disposition d'un character qui est en cours de création.
      await newCharacter.save({ session: this.session });

      await new PatchManager(this.session, this.user!).PatchCreate({
        type: 'CREATE_REQUEST',
        status: 'PENDING',
        target: { id: newCharacter.id },
        note,
        targetPath: 'Character',
        newValues: newCharacter.toJSON(),
        oldValues: null,
        author: { id: this.user!.id }
      });

      return newCharacter;
    } catch (err) {
      await this.avatarManager?.deleteImageIfSaved();
      throw err;
    }
  }

  public async update(characterID: string, note?: string) {
    const newCharacterData = new CharacterModel(this.newData);
    try {
      const characterToUpdate = await CharacterModel.findOne(
        { id: characterID },
        {},
        { session: this.session }
      );

      if (!characterToUpdate)
        throw new APIError('Aucun personnage correspondant.', 'NOT_FOUND', 404);

      newCharacterData._id = characterToUpdate._id;
      newCharacterData.id = characterToUpdate.id;

      const changes = getChangedData(characterToUpdate.toJSON(), newCharacterData, [
        '_id',
        'id',
        'createdAt',
        'updatedAt'
      ]);

      if (!changes) throw new APIError("Aucun changement n'a été détecté", 'EMPTY_CHANGES', 400);

      await characterToUpdate.updateOne({ $set: changes.newValues }, { session: this.session });

      await new PatchManager(this.session, this.user!).PatchCreate({
        type: 'UPDATE',
        status: 'ACCEPTED',
        target: { id: newCharacterData.id },
        note,
        targetPath: 'Character',
        newValues: changes?.newValues,
        oldValues: changes?.oldValues,
        author: { id: this.user!.id }
      });

      return newCharacterData;
    } catch (err) {
      await this.avatarManager?.deleteImageIfSaved();
      throw err;
    }
  }

  public async updateRequest(characterID: string, note?: string) {
    const newCharacterData = new CharacterModel(this.newData);
    try {
      const characterToUpdate = await CharacterModel.findOne(
        { id: characterID },
        {},
        { session: this.session }
      );

      if (!characterToUpdate)
        throw new APIError('Aucun personnage correspondant.', 'NOT_FOUND', 404);

      newCharacterData._id = characterToUpdate._id;
      newCharacterData.id = characterToUpdate.id;

      const changes = getChangedData(characterToUpdate.toJSON(), newCharacterData, [
        '_id',
        'id',
        'createdAt',
        'updatedAt'
      ]);

      if (!changes) throw new APIError("Aucun changement n'a été détecté", 'EMPTY_CHANGES', 400);

      await characterToUpdate.updateOne({ $set: changes.newValues }, { session: this.session });

      await new PatchManager(this.session, this.user!).PatchCreate({
        type: 'UPDATE_REQUEST',
        status: 'PENDING',
        target: { id: newCharacterData.id },
        note,
        targetPath: 'Character',
        newValues: changes?.newValues,
        oldValues: changes?.oldValues,
        author: { id: this.user!.id }
      });

      if (this.avatarManager?.hasNewImage())
        await this.avatarManager.deleteImageFile(characterToUpdate.avatar?.id);

      return newCharacterData;
    } catch (err) {
      await this.avatarManager?.deleteImageIfSaved();
      throw err;
    }
  }

  public async createRelation(relation: IAdd_Character_ZOD) {
    if (relation.newCharacter) {
      const initChataracter = await this.init(relation.newCharacter);
      const newCharacter = await initChataracter.create();
      return { id: newCharacter.id, role: relation.role };
    } else if (relation.id && (await CharacterModel.exists({ id: relation.id }))) {
      return { id: relation.id, role: relation.role };
    } else {
      throw new Error('Character invalide');
    }
  }

  public async createMultipleRelation(relations: IAdd_Character_ZOD[]) {
    const relList: { id: string; role: IAdd_Character_ZOD['role'] }[] = [];
    for await (const relation of relations) {
      const rel = await this.createRelation(relation);
      relList.push(rel);
    }
    return relList;
  }
}
