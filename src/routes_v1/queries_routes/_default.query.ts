import { IDefaultSite } from "@actunime/types";
import {
  MediaFormatSelection,
  MediaGenresSelection,
  MediaParentLabelSelection,
  MediaSourceSelection,
  MediaStatusSelection,
} from "@actunime/utils";
export const GetDefaultRouter = (): IDefaultSite => {
  return {
    medias: {
      genres: MediaGenresSelection,
      status: MediaStatusSelection,
      source: MediaSourceSelection,
      parent: MediaParentLabelSelection,
      format: MediaFormatSelection,
    },
  };
};
