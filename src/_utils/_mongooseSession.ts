import { DevLog } from "@actunime/utils";
import { MessageBuilder } from "discord-webhook-node";
import { FastifyReply, FastifyRequest } from "fastify";
import mongoose, { ClientSession } from "mongoose";
import { APIDiscordWebhook } from "./_discordWebhook";
import { ImageController } from "../controllers/image.controller";
import { APIError } from "../_lib/Error";

export const activesSessions = new Map<string, ClientSession>();

export const addSessionHandler = async (req: FastifyRequest) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    req.mongooseSession = session;
    activesSessions.set(req.id, session);
    DevLog("SessionMongoose en cours d'utilisation", "debug");
};

export const removeSessionHandler = async (req: FastifyRequest, res: FastifyReply) => {
    const status = res.statusCode;

    const embedCommited = new MessageBuilder()
        .setTitle("Base de données | Session")
        .setColor(0x00ff00)
        .setDescription(`Toutes les modifications précédentes ont été appliquées !`);

    const embedAborted = new MessageBuilder()
        .setTitle("Base de données | Session")
        .setColor(0xff0000)
        .setDescription(`Toutes les modifications précédentes ont été annulées !`);

    if (req.mongooseSession && req.mongooseSession.inTransaction()) {
        const imageController = new ImageController(null);
        if (status >= 400) {
            await req.mongooseSession.abortTransaction();
            await req.mongooseSession.endSession();
            activesSessions.delete(req.id);
            DevLog("SessionMongoose annulée", "warn");
            await APIDiscordWebhook.send(embedAborted);
        } else {
            // Pour éviter de sauvegarder pendant les tests
            const commit = true;

            if (commit) {
                try {
                    await Promise.all(ImageController.saveImages
                        .filter((image) => image.session_id === req.mongooseSession?.id)
                        .map(async (image) => {
                            console.log("Création des fichiers images", image.data.id, image.data.path);
                            await imageController.createImageFile(image.data);
                        }));
                    await Promise.all(ImageController.deleteImages
                        .filter((image) => image.session_id === req.mongooseSession?.id)
                        .map(async (image) => {
                            console.log("Suppression des fichiers images", image.id, image.path);
                            await imageController.deleteImageFile(image.id, image.path);
                        }));
                    await req.mongooseSession.commitTransaction();
                } catch (error) {
                    res.send(new APIError("Les fichiers des images n'ont pas pu étre crée/supprimé pour une raison inconnue", "SERVER_ERROR"));
                    DevLog("SessionMongoose annulée", "warn");
                }
            }
            await req.mongooseSession.endSession();
            activesSessions.delete(req.id);
            DevLog("SessionMongoose validée", "debug");

            if (commit) {
                await APIDiscordWebhook.send(embedCommited);
            } else
                await APIDiscordWebhook.send(embedAborted);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        req.mongooseSession = undefined as any;
    }
}