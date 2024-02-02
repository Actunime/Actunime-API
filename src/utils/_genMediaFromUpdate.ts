import { type IMediaUpdates } from "./_media.update";

export function genMediaFromUpdate<T extends object>(updates: IMediaUpdates<T>[]): T | null {

    function sortByCreatedAt(a: IMediaUpdates<any>, b: IMediaUpdates<any>) {
        if (!b.createdAt || !a.createdAt) return 0;
        return a.createdAt.getTime() - b.createdAt.getTime() // De la moins récente a la plus récente
    }

    const sortedUpdate = updates.sort(sortByCreatedAt);

    let data: T = Object();

    for (let i = 0; i < sortedUpdate.length; i++) {
        let obj = sortedUpdate[i].data;
        for (const key in obj) {
            let value = obj[key];
            // Ignorer les valeurs non défini
            if (typeof value === 'undefined')
                continue;
            // // Ignorer les arrays vide
            // if (Array.isArray(value)) {
            //     if (value.length === 0)
            //         continue;
            // }
            Object.assign(data, { [key]: value })
        }
    }

    return Object.keys(data).length ? data : null;
}