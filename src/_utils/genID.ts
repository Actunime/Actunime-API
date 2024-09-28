import ShortUniqueId from 'short-unique-id';

export function genPublicID(size: number = 5) {
  const uid = new ShortUniqueId({ length: size || 5 });
  const id = uid.rnd();
  return id;
}
