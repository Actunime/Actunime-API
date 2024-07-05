import { ActivityModel } from '../_models';
import { IActivityCreateProps } from '../_types/activityType';
import { IActivityAction, IActivityType } from '../_utils/activityUtil';

export class ActivityManager {
  static async CreateActivity(
    type: IActivityType,
    action: IActivityAction,
    props: Omit<IActivityCreateProps, 'type' | 'action'>
  ) {
    if (!type) throw new Error('Type not found');
    if (!action) throw new Error('Action not found');

    const newActivity = new ActivityModel({
      ...props,
      type,
      action
    });

    await newActivity.validate();
    const saved = await newActivity.save({ validateBeforeSave: false });

    return saved;
  }
}
