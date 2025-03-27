import { User } from '../_lib/media/_user';
import { APIError } from '../_lib/error';

function textHasLink(text: string): boolean {
  const urlRegex = /https?:\/\/[^\s]+/i;
  return urlRegex.test(text);
}

function textHasLinkNotActunime(text: string): boolean {
  const urlRegex = /https?:\/\/(?!actunime\.fr)[^\s]+/i;
  return urlRegex.test(text);
}

function userIsDefined(user?: User | null): asserts user is User {
  if (!user)
    throw new APIError(
      'Vous devez être connecté pour cette action',
      'UNAUTHORIZED'
    );
}

type Checker = {
  textHasLink: (text: string) => boolean;
  textHasLinkNotActunime: (text: string) => boolean;
  userIsDefined: (user?: User | null) => asserts user is User;
};

export const Checker: Checker = {
  textHasLink,
  textHasLinkNotActunime,
  userIsDefined,
};
