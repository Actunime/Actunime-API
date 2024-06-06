import { customAlphabet } from "nanoid";

export function genPublicID(size: number = 5) {
  const alphabet = `${Date.now() + 14580}abcdefghijklmnopqrstuvwxyz` + crypto.randomUUID();
  const nanoid = customAlphabet(alphabet, size);
  const generatedID = nanoid();
  return generatedID;
}