export const AnimeFormatObj = {
  SERIE: { label: "Série", description: "Diffusé en épisodes réguliers." },
  SERIE_COURTE: { label: "Série courte", description: "Diffusé en épisodes courts, généralement moins de 15 minutes chacun." },
  FILM: { label: "Film", description: "Produit comme un long métrage." },
  ONA: { label: "ONA", description: "Diffusé directement sur Internet." },
  OVA: { label: "OVA", description: "Destiné à la vente directe aux consommateurs." },
  SPECIAL: { label: "Spécial", description: "Un épisode unique ou une série d'épisodes qui ne fait pas partie de la diffusion régulière d'une série." }
}

export type IAnimeFormat = keyof typeof AnimeFormatObj;
export const AnimeFormatArray = Object.keys(AnimeFormatObj) as IAnimeFormat[] & [string, ...string[]];
export const AnimeFormatSelection = AnimeFormatArray.map((key) => ({
  label: AnimeFormatObj[key].label,
  description: AnimeFormatObj[key].description,
  value: key
}))