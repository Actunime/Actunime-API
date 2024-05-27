
export const TrackTypeObj = {
  OPENING: {
    label: "Opening",
    description: "Générique de début",
    value: "OPENING",
  },
  ENDING: {
    label: "Ending",
    description: "Générique de fin",
    value: "ENDING",
  },
  OST: {
    label: "OST",
    description: "Musique de fond",
    value: "OST",
  },
  INSERT: {
    label: "INSERT",
    description: "Musique insérée pendant une scène",
    value: "INSERT",
  },
};

export type ITrackType = keyof typeof TrackTypeObj;
export const TrackTypeArray = Object.keys(TrackTypeObj) as ITrackType[] & [string, ...string[]];
export const TrackTypeSelection = TrackTypeArray.map((key) => ({
  label: TrackTypeObj[key].label,
  description: TrackTypeObj[key].description,
  value: key
}))