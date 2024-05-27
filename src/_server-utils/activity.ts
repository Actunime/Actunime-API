import { ActivityModel } from "../_models/_activityModel";
import { IActivityCreateProps, } from "../_types/activityType";
import { IActivityAction, IActivityType } from "../_utils/activityUtil";

export async function CreateActivity(
  type: IActivityType,
  action: IActivityAction,
  props: Omit<IActivityCreateProps, 'type' | 'action'>) {

  const newActivity = new ActivityModel({
    ...props,
    type,
    action,
  })

  await newActivity.validate();
  const saved = await newActivity.save({ validateBeforeSave: false });

  return saved;
}