'use client';

import { ITargetPath, ITargetPathType } from "./global";
import { IPaginationResponse } from "../_types/paginationType";

export async function searchMedia<TPath extends ITargetPath, TRes = IPaginationResponse<ITargetPathType<TPath>>, T = any>(path: TPath, pagination?: T, reqOption?: RequestInit): Promise<TRes | null> {
    const urlParams = new URLSearchParams({ pagination: JSON.stringify(pagination) }).toString();
    const req = await fetch(`/api/${path.toLowerCase() + 's'}${pagination ? '?' + urlParams : ''}`, {
        ...reqOption,
        method: "GET",
    });
    if (req.status !== 200)
        return null;

    const res = await req.json();
    return res;
}

export async function getMedia<TPath extends ITargetPath, TRes = ITargetPathType<TPath>, T = any>(path: TPath, mediaID: string, withMedia?: T, reqOption?: RequestInit): Promise<TRes | null> {
    const urlParams = new URLSearchParams({ withMedia: JSON.stringify(withMedia) }).toString();
    const req = await fetch(`/api/${path.toLowerCase() + 's'}/${mediaID}${withMedia ? '?' + urlParams : ''}`, {
        ...reqOption,
        method: "GET",
    });

    const res = await req.json();
    return res;
}

export async function updateMedia<TPath extends ITargetPath, TRes = ITargetPathType<TPath>, T = any>(path: TPath, mediaID: string, data: T, reqOption?: RequestInit): Promise<TRes | null> {
    const req = await fetch(`/api/${path.toLowerCase() + 's'}/${mediaID}/update`, {
        ...reqOption,
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });
    let res;

    try {
        res = await req.json();
    } catch (error) {
        throw new Error("La requête de modification n'a pas pu se terminer correctement");
    }

    if (res.error)
        throw new Error("Serveur: " + res.error);

    if (res.data)
        return res.data;

    return res;
}

export async function createMedia<TPath extends ITargetPath, TRes = ITargetPathType<TPath>, T = any>(path: TPath, data: T, reqOption?: RequestInit): Promise<TRes | null> {
    const req = await fetch(`/api/${path.toLowerCase() + 's'}/create`, {
        ...reqOption,
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    const res = await req.json();
    return res;
}