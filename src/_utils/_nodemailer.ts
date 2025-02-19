import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import dotenv from 'dotenv';
dotenv.config({
  path: [`.env.${process.env.NODE_ENV || 'development'}`, '.env.local'],
});

const config: SMTPTransport.Options = {
    service: "ionos",
    host: process.env.EMAIL_SERVER_HOST as any,
    port: process.env.EMAIL_SERVER_PORT as any,
    secure: true,
    auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
    },
    from: process.env.EMAIL_FROM,
    tls: {
        rejectUnauthorized: false
    },
    ignoreTLS: true,
    logger: true,
    debug: true
}

console.log(config);

export const MailTransport = nodemailer.createTransport(config);

MailTransport.verify((err) => {
    if (err) {
        console.error(err);
    }
})