export function createDataFromUpdate<T extends object, U extends { changes: T, createdAt: Date } = { changes: T, createdAt: Date }>(updates: any[], passId?: string): T | null {

    function sortByCreatedAt(a: U, b: U) {
        return a.createdAt.getTime() - b.createdAt.getTime() // De la moins récente a la plus récente
    }

    const sortedUpdate = updates.sort(sortByCreatedAt);

    let data: T = Object();

    for (let i = 0; i < sortedUpdate.length; i++) {
        let obj = sortedUpdate[i].changes;
        for (const key in obj) {
            let value = obj[key];
            if (typeof value === 'undefined')
                continue;
            Object.assign(data, { [key]: value })
        }
    }

    return Object.keys(data).length ? passId && Object.assign(data, { id: passId }) || data : null;
}