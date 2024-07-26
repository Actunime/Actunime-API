import ObservableSlim from 'observable-slim';


function getChangedData<T = object>(previousData: any, changedData: any, ignoreKeys?: string[]): Record<string, T> | undefined {
  const newValues: any = {};
  const oldValues: any = {};

  const listener = ObservableSlim.create({ ...previousData }, false, function ([changes]) {
    if (Array.isArray(changes.newValue)) {
      if (changes.newValue.length === changes.previousValue.length) {
        const arrayHasChanged = changes.newValue.every((item, index) => {
          if (typeof item === 'object') {
            const hasChanges = getChangedData(changes.previousValue[index], item);
            console.log(hasChanges)
            return hasChanges ? false : true;
          }
          return item === changes.previousValue[index]
        })
        if (arrayHasChanged)
          return; // Aucune modification sur le tableau
      }
    }
    if (changes.currentPath.includes(".") || ignoreKeys?.includes(changes.currentPath))
      return;

    Object.assign(newValues, { [changes.currentPath]: changes.newValue });
    Object.assign(oldValues, { [changes.currentPath]: changes.previousValue });
  })

  Object.assign(listener, changedData);

  ObservableSlim.remove(listener);

  return Object.keys(newValues).length || Object.keys(oldValues).length ? {
    newValues,
    oldValues
  } : undefined;
}

export { getChangedData };
