import {
  MediaFormatSelection,
  MediaGenresSelection,
  MediaParentLabelSelection,
  MediaSourceSelection,
  MediaStatusSelection
} from '@/_utils/mediaUtil';
import { FastifyReply, FastifyRequest } from 'fastify';

export const GetDefaultRouter = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    return {
      medias: {
        genres: MediaGenresSelection,
        status: MediaStatusSelection,
        source: MediaSourceSelection,
        parent: MediaParentLabelSelection,
        format: MediaFormatSelection
      }
    };
  } catch (err) {
    console.log(err);
    res.code(400).send();
  }
};
