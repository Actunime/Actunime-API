export function cleanObject(obj: any): any {
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([_, v]) => v != null)
      .map(([k, v]) => {
        if (typeof v === "object" && !Array.isArray(v)) {
          const emptyObj = cleanObject(v);

          if (!Object.keys(emptyObj).length) {
            return [k, undefined];
          }

          return [k, emptyObj];
        }
        // else if (typeof v === 'object' && Array.isArray(v)) {
        //   if (!v.length)
        //     return [k, undefined]
        // }
        return [k, v];
      })
      .filter(([_, v]) => v != null),
  );
}

export function isEqualObject([obj1, obj2]: [any, any]): boolean {
  obj1 = cleanObject(obj1);
  obj2 = cleanObject(obj2);

  if (typeof obj1 !== "object" || typeof obj2 !== "object") return false;

  if (Object.keys(obj1).length !== Object.keys(obj2).length) return false;

  function EqualKey([obj1, obj2]: [object, object]): {
    [key: string]: boolean;
  } {

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    let keysEqual: { [key: string]: boolean } = {};

    if (keys1.length !== keys2.length) return keysEqual;

    for (let i = 0; i < keys1.length; i++) {
      const key = keys1[i] as keyof typeof obj1 & keyof typeof obj2;
      const value1 = obj1[key] as string | number | object;
      const value2 = obj2[key] as string | number | object;

      if (value1 === null && value2 === null) {
        keysEqual[key] = true;
        continue;
      }

      if ((value1 && !value2) || (!value1 && value2) || (!value1 && !value2)) {
        keysEqual[key] = false;
        continue;
      }

      if (Array.isArray(value1) && Array.isArray(value2)) {
        keysEqual[key] = isEqualArray([value1, value2]);
        continue;
      }

      if (
        typeof value1 === "object" &&
        !Array.isArray(value1) &&
        typeof value2 === "object" &&
        !Array.isArray(value2)
      ) {
        const equalKeys = EqualKey([value1, value2]);
        keysEqual[key] =
          (Object.keys(equalKeys).length &&
            Object.keys(equalKeys).every((key) => equalKeys[key])) ||
          false;
        continue;
      }

      if (typeof value1 === "string" && typeof value2 === "string") {
        keysEqual[key] = value1 === value2;
        continue;
      }

      keysEqual[key] = false;
    }

    return keysEqual;
  }

  const equalKeys = EqualKey([cleanObject(obj1), cleanObject(obj2)]);

  return (
    (Object.keys(equalKeys).length &&
      Object.keys(equalKeys).every((key) => equalKeys[key])) ||
    false
  );
}

export function isEqualValue(value1: any, value2: any): boolean {
  if (typeof value1 !== typeof value2) return false;

  if (typeof value1 === "object" && typeof value2 === "object") {
    return isEqualObject([value1, value2]);
  }

  return value1 === value2;
}

export function isEqualArray([array1, array2]: [any, any]) {
  // Unique array;
  array1 = array1?.filter((value: any, index: number, self: Array<any>) => {
    return self.indexOf(value) === index;
  });

  array2 = array2?.filter((value: any, index: number, self: Array<any>) => {
    return self.indexOf(value) === index;
  });

  if (array1?.length !== array2?.length) return false;

  const equalsValueFound: boolean[] = [];

  for (let i = 0; i < array1.length; i++) {
    const value1 = array1[i];
    for (let y = 0; y < array2.length; y++) {
      const value2 = array2[y];
      if (typeof value1 === "object" && typeof value2 === "object") {
        if (isEqualObject([value1, value2])) {
          equalsValueFound.push(true);
        }
        continue;
      }
      if (value1 === value2) {
        // console.log(i + "-" + value1, y + "-" + value2);
        equalsValueFound.push(true);
        continue;
      }
    }
  }

  // console.log("equalsValueFound", equalsValueFound);

  if (
    equalsValueFound.length === array1.length &&
    equalsValueFound.length === array2.length
  ) {
    return equalsValueFound.every((v) => v == true);
  } else {
    return false;
  }
}



export function changedObjKeys<T extends { [key: string]: any }>([oldOjb, newObj]: [T, any]) {
  let changes: { [key: string]: any } = {};
  let before: { [key: string]: any } = {};

  let oldLenght = Object.keys(oldOjb || {}).length
  let newLenght = Object.keys(newObj || {}).length
  const obj = oldLenght > newLenght ? oldOjb : newObj
  // Comparaison des champs
  for (const key in obj) {
    if (Array.isArray(oldOjb?.[key]) || Array.isArray(newObj?.[key])) {
      if (!isEqualArray([oldOjb?.[key], newObj?.[key]])) {
        changes[key] = newObj?.[key]
        before[key] = oldOjb?.[key]
      }
    } else if (typeof oldOjb?.[key] === 'object' || typeof newObj?.[key] === 'object') {

      let changes = changedObjKeys([oldOjb[key], newObj[key]]);
      if (Object.keys(changes.changes).length)
        changes[key as keyof typeof changes] = changes.changes


      if (Object.keys(changes.before).length)
        before[key] = changes.before

    } else if (oldOjb?.[key] !== newObj?.[key]) {
      // console.log("key", key, newObj?.[key], oldOjb?.[key])
      changes[key] = newObj?.[key]
      before[key] = oldOjb?.[key]
    }
  }
  // Nouveaux champs
  // for (const key in cleanObject(newObj || {})) {
  //   if (!Object.keys(oldOjb).includes(key)) {
  //     changes[key] = newObj?.[key]
  //     before[key] = undefined
  //   }
  // }

  return { changes, before };
}

// V2
export function ObjCheckChanged(prevData: any, newData: any, ignoreKeys: string[] = []) {

  const getKeys = [...Object.keys(prevData || {}), ...Object.keys(newData || {})];
  const keys = getKeys.filter((ele, pos) => (getKeys.indexOf(ele) === pos) && !ignoreKeys.includes(ele));

  const changes = new Object();
  const changesH = new Object();
  const befores = new Object();

  for (const key of keys) {

    if (ignoreKeys.includes(key)) continue;

    const typeofPrevData = typeof prevData?.[key];
    const typeofNewData = typeof newData?.[key];

    const prevDataValue = prevData?.[key];
    const newDataValue = newData?.[key];

    if (typeofNewData === 'undefined' && typeofPrevData !== 'undefined') {
      Object.assign(changesH, { [key]: "N'est plus défini" });
      Object.assign(changes, { [key]: undefined });
      continue;
    }

    if (typeofPrevData === 'object' || typeofNewData === 'object') {

      if (Array.isArray(prevDataValue) || Array.isArray(newDataValue)) {

        if (!isEqualArray([prevDataValue, newDataValue])) {
          Object.assign(changes, { [key]: newDataValue });
          Object.assign(changesH, { [key]: newDataValue });
          Object.assign(befores, { [key]: prevDataValue });
        }
      } else {
        const check = ObjCheckChanged(prevDataValue, newDataValue, ignoreKeys);

        if (check.changes) Object.assign(changes, { [key]: check.changes })
        if (check.changesH) Object.assign(changesH, { [key]: check.changesH })
        if (check.befores) Object.assign(befores, { [key]: check.befores })
      }
    } else if (typeofPrevData === 'string' && typeofNewData === 'string') {
      let trimedPrevDataValue = prevDataValue && prevDataValue.trim();
      let trimedNewDataValue = newDataValue?.trim();
      if (trimedPrevDataValue !== trimedNewDataValue) {
        if (trimedNewDataValue.length > 0) {
          Object.assign(changes, { [key]: trimedNewDataValue })
          Object.assign(changesH, { [key]: trimedNewDataValue });
          Object.assign(befores, { [key]: prevDataValue })
        } else if (trimedPrevDataValue && !trimedNewDataValue) {
          Object.assign(changes, { [key]: undefined })
          Object.assign(changesH, { [key]: "N'est plus défini" });
          Object.assign(befores, { [key]: prevDataValue })
        }
      }
    } else if (prevDataValue !== newDataValue) {
      Object.assign(changes, { [key]: newDataValue })
      Object.assign(changesH, { [key]: newDataValue });
      Object.assign(befores, { [key]: prevDataValue })
    }
  }

  return {
    changes: Object.keys(changes).length ? changes : undefined,
    changesH: Object.keys(changesH).length ? changesH : undefined,
    befores: Object.keys(befores).length ? befores : undefined
  }
}

export function ObjKeyToDotKey(obj: any, prevKey?: string) {
  const asDot = new Object({});

  for (const key in obj) {
    const typeofValue = typeof obj?.[key];
    const value = obj?.[key];

    if (typeofValue === 'object') {
      if (Array.isArray(value)) {
        Object.assign(asDot, { [prevKey ? `${prevKey}.${key}` : key]: value })
      } else {
        const check = ObjKeyToDotKey(value, key);
        Object.assign(asDot, check)
      }
    } else {
      Object.assign(asDot, { [prevKey ? `${prevKey}.${key}` : key]: value })
    }
  }

  return asDot;
}


export function ArrayCheckChanged(prevData: Array<any>, newData: Array<any>) {

  prevData = prevData?.filter((value: any, index: number, self: Array<any>) => {
    return self.indexOf(value) === index;
  });

  newData = newData?.filter((value: any, index: number, self: Array<any>) => {
    return self.indexOf(value) === index;
  })

  const added = [];
  const removed = [];

  for (let i = 0; i < prevData.length; i++) {
    const element = prevData[i];

    if (typeof element !== 'object') {
      if (!newData.includes(element))
        removed.push(element);
    } else {
      throw new Error('ArrayCheckChanged ne supporte pas les tableaux de type object');
    }
  }

  for (let i = 0; i < newData.length; i++) {
    const element = newData[i];

    if (typeof element !== 'object') {
      if (!prevData.includes(element))
        added.push(element);
    } else {
      throw new Error('ArrayCheckChanged ne supporte pas les tableaux de type object');
    }
  }

  return { added, removed, changed: added.length > 0 || removed.length > 0 };
}