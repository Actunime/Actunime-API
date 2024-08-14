export const UserRolesObj = {
  MEMBER: { label: 'Membre', level: 0 },
  PREMIUM: { label: 'Premium', level: 1 }, // 1 << 0"Premium",
  MODERATOR: { label: 'Modérateur', level: 1 << 1 }, // 1 << 1"Modérateur",
  ANIME_MODERATOR: { label: 'Modérateur - Anime', level: 1 << 2 }, // 1 << 2"Modérateur - Anime",
  MANGA_MODERATOR: { label: 'Modérateur - Manga', level: 1 << 3 }, // 1 << 3"Modérateur - Manga",
  CHARACTER_MODERATOR: { label: 'Modérateur - Personnage', level: 1 << 4 }, // 1 << 4"Modérateur - Personnage",
  PERSON_MODERATOR: { label: 'Modérateur - Personnes', level: 1 << 5 }, // 1 << 5"Modérateur - Personnes",
  TRACK_MODERATOR: { label: 'Modérateur - Musique', level: 1 << 6 }, // 1 << 6"Modérateur - Musique",
  COMPANY_MODERATOR: { label: 'Modérateur - Société', level: 1 << 7 }, // 1 << 7"Modérateur - Société",
  ADMINISTRATOR: { label: 'Administrateur', level: 1 << 8 }, // 1 << 8"Administrateur",
  ACTUNIME: { label: 'Actunime', level: 1 << 9 } // 1 << 9"Actunime",
};

export type IUserRoles = keyof typeof UserRolesObj;
export const UserRolesLevel = Object.fromEntries(
  (Object.keys(UserRolesObj) as IUserRoles[]).map((key) => [key, UserRolesObj[key].level])
) as Record<IUserRoles, number>;

export const UserRolesLabel = Object.fromEntries(
  (Object.keys(UserRolesObj) as IUserRoles[]).map((key) => [key, UserRolesObj[key].label])
) as Record<IUserRoles, string>;

export const UserRolesArray = Object.keys(UserRolesObj) as IUserRoles[] & [string, ...string[]];
export const UserRolesSelection = UserRolesArray.map((key) => ({
  label: UserRolesObj[key].label,
  value: key
}));

export const userHasRole = (userRoles: IUserRoles[], roles: IUserRoles | IUserRoles[]) => {
  if (Array.isArray(roles)) {
    return roles.every((role) => userRoles.includes(role));
  } else {
    return userRoles.includes(roles);
  }
};

export const getRoleLevel = (role: IUserRoles) => {
  const level = UserRolesLevel[role];
  if (level === undefined) {
    throw 'Rôle non reconnu';
  }
  return level;
};

export const userPermissionLevel = (userRoles: IUserRoles[]) =>
  userRoles.reduce((acc, role) => acc | getRoleLevel(role), 0);

export const userPermissionIsHigherThan = (
  userRoles: IUserRoles[],
  roles: IUserRoles | IUserRoles[]
) => {
  if (Array.isArray(roles)) {
    return roles.every((role) => userPermissionLevel(userRoles) >= getRoleLevel(role));
  } else {
    return userPermissionLevel(userRoles) >= userPermissionLevel([roles]);
  }
};
