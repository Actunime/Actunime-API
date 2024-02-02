import { customAlphabet } from "nanoid";

export function genPublicID() {
    const alphabet = `${Date.now()}abcdefghijklmnopqrstuvwxyz`;
    const nanoid = customAlphabet(alphabet, 5);
    let generatedID = nanoid()
    console.log(generatedID)
    return generatedID
}