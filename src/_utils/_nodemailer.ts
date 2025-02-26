import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

const production = process.env.NODE_ENV === 'production';
const config: SMTPTransport.Options = {
    service: production ? "ionos" : "gmail",
    host: process.env.EMAIL_SERVER_HOST as any,
    port: process.env.EMAIL_SERVER_PORT as any,
    secure: production,
    auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
    },
    from: process.env.EMAIL_FROM,
    tls: {
        rejectUnauthorized: false
    },
    ignoreTLS: true,
    logger: production,
    debug: production
}

export const MailTransport = nodemailer.createTransport(config);