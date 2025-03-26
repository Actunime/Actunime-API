import { DevLog } from '../_lib/logger';
import { MessageBuilder } from 'discord-webhook-node';
import { FastifyReply, FastifyRequest } from 'fastify';
import mongoose, { ClientSession } from 'mongoose';
import { APIDiscordWebhook } from './_discordWebhook';
import { ImageController } from '../controllers/image.controller';
import { APIError } from '../_lib/error';
import { Image } from '../_lib/media/_image';

export const activesSessions = new Map<ClientSession['id'], ClientSession>();

export const addSessionHandler = async (req: FastifyRequest) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  req.mongooseSession = session;

  activesSessions.set(session.id, session);
  DevLog("SessionMongoose en cours d'utilisation", 'debug');
};

export const removeSessionHandler = async (
  req: FastifyRequest,
  res: FastifyReply
) => {
  const status = res.statusCode;

  const embedCommited = new MessageBuilder()
    .setTitle('Base de données | Session')
    .setColor(0x00ff00)
    .setDescription(
      `Toutes les modifications précédentes ont été appliquées !`
    );

  const embedAborted = new MessageBuilder()
    .setTitle('Base de données | Session')
    .setColor(0xff0000)
    .setDescription(`Toutes les modifications précédentes ont été annulées !`);

  if (req.mongooseSession && req.mongooseSession.inTransaction()) {
    if (status >= 400) {
      await req.mongooseSession.abortTransaction();
      await req.mongooseSession.endSession();
      activesSessions.delete(req.mongooseSession.id);
      DevLog(`Session annulé a cause du status ${status}`, 'warn');
      if (!req.isTesting) await APIDiscordWebhook.send(embedAborted);
    } else {
      // Pour éviter de sauvegarder pendant les tests
      console.log("DB NAME", mongoose.connection.db?.databaseName);
      const commit = req.isTesting && mongoose.connection.db?.databaseName !== "test" ? false : true;

      if (commit) {
        try {
          await Promise.all(
            ImageController.saveImages
              .filter((image) => image.session_id === req.mongooseSession?.id)
              .map(async (image) => {
                console.log(
                  'Création des fichiers images',
                  image.data.id,
                  image.data.path
                );
                await Image.createFileCDN(image.data);
              })
          );
          await Promise.all(
            ImageController.deleteImages
              .filter((image) => image.session_id === req.mongooseSession?.id)
              .map(async (image) => {
                console.log(
                  'Suppression des fichiers images',
                  image.data.id,
                  image.data.path
                );
                await Image.deleteFileCDN(image.data);
              })
          );
          await req.mongooseSession.commitTransaction();
          DevLog('Session validé', 'debug');
        } catch (error) {
          DevLog(`Session annulé a cause d'une erreur ${status}`, 'warn');
          console.error(error);
          throw new APIError(
            "Les fichiers des images n'ont pas pu étre crée/supprimé pour une raison inconnue",
            'SERVER_ERROR'
          );
        }
      } else {
        DevLog(
          `Aucune données n'a été pris en compte ! ${
            req.isTesting ? '(test)' : ''
          }`,
          'warn'
        );
      }

      await req.mongooseSession.endSession();
      activesSessions.delete(req.mongooseSession.id);
      DevLog('Session terminé', 'debug');

      if (!req.isTesting) {
        if (commit) {
          await APIDiscordWebhook.send(embedCommited);
        } else await APIDiscordWebhook.send(embedAborted);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    req.mongooseSession = undefined as any;
  }
};
