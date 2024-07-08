
import onChange from 'on-change';

async function getChangedData(previousData: any, changedData: any, ignoreKeys?: string[]) {
  const newValues = {};
  const oldValues = {};

  // const { default: onChange } = await import('on-change');

  const watchChange = onChange(
    previousData,
    async function (path, value, previousValue: any, applyData) {
      if (Array.isArray(value)) {
        const changes = await getChangedData(previousValue, value, ignoreKeys);
        if (changes) {
          newValues[path] = value || [];
          oldValues[path] = previousValue || [];

          for (const index in changes.newValues) {
            if (Object.hasOwnProperty.call(changes.newValues, index)) {
              const newValue = changes.newValues[index];
              newValues[path].splice(index, 1, newValue);
            }
          }

          for (const index in changes.oldValues) {
            if (Object.hasOwnProperty.call(changes.oldValues, index)) {
              const oldValue = changes.oldValues[index];
              oldValues[path].splice(index, 1, oldValue);
            }
          }

          oldValues[path] = oldValues[path].filter((item) => item !== undefined);
        } else {
          const valueIsEqualOfChangedData =
            value.every((item, index) => item === this[path][index]) &&
            value.length === previousValue.length;
          if (!valueIsEqualOfChangedData) newValues[path] = value;

          const previousValueIsEqualOfPreviousValue =
            previousValue.every((item, index) => item === previousValue[index]) &&
            value.length === previousValue.length;
          if (!previousValueIsEqualOfPreviousValue) oldValues[path] = previousValue;
        }
      } else if (typeof value === 'object') {
        const changes = await getChangedData(previousValue, value, ignoreKeys);
        if (changes) {
          Object.assign(newValues, { [path]: changes.newValues });
          Object.assign(oldValues, { [path]: changes.oldValues });
        }
      } else {
        Object.assign(newValues, { [path]: value });
        Object.assign(oldValues, { [path]: previousValue });
      }
    },
    { ignoreKeys }
  );

  Object.assign(watchChange, changedData);
  onChange.unsubscribe(watchChange);
  if (Object.keys(newValues).length || Object.keys(oldValues).length)
    return {
      newValues,
      oldValues
    };
  else return undefined;
}

export { getChangedData };
