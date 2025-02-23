

function textHasLink(text: string): boolean {
    const urlRegex = /https?:\/\/[^\s]+/i;
    return urlRegex.test(text);
}

function textHasLinkNotActunime(text: string): boolean {
    const urlRegex = /https?:\/\/(?!actunime\.fr)[^\s]+/i
    return urlRegex.test(text);
}

export const Checker = {
    textHasLink,
    textHasLinkNotActunime
}