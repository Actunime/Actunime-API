import { IPersonCreateBody } from '@actunime/validations';
import personsJSON from '../../mokes/persons.json';
import { removeDBKeys } from './anime';

export const PersonTestData: IPersonCreateBody['data'] = removeDBKeys<
  IPersonCreateBody['data']
>(JSON.parse(JSON.stringify(personsJSON))[0]);

export const PersonCreateRequestData: IPersonCreateBody['data'] = {
  name: {
    default: 'Dev Dev',
  },
  birthDate: {
    year: 2003,
    month: 2,
    day: 27,
  },
  description: 'test',
};
