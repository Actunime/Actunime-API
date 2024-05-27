import { UpdateModel } from "../_models/_updateModel";
import { IUpdate } from "../_types/updateType";

export async function CreateUpdate(props: Omit<IUpdate, 'id' | '_id'>) {
  if (["DELETE", "UPDATE"].includes(props.type) && !props.target) {
    throw new Error(
      "Vous devez spécifier un target pour l'action DELETE/UPDATE"
    );
  }

  const newUpdate = new UpdateModel(props);
  await newUpdate.validate();

  const saved = await newUpdate.save();

  return saved;
}