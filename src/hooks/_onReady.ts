import { FastifyInstance } from "fastify";
import { MailTransport } from "../_utils/_nodemailer";

export const OnReadyHook = async (fastify: FastifyInstance) => {
    fastify.addHook('onReady', async () => {
        MailTransport.verify((err) => {
            if (err) console.error(err);
            else console.info('Nodemailer prêt !');
        });
    })
}