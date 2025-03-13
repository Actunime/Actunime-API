import fetch from "node-fetch";
import dotenv from 'dotenv';
dotenv.config({ path: [`.env.${process.env.NODE_ENV || 'development'}`.trim()] });

const opts = {
    appOrigin: process.env.APP_ORIGIN as string,
    keycloakSubdomain: process.env.KEYCLOAK_SERVER_URL as string,
    clientId: process.env.KEYCLOAK_CLIENT_ID as string,
    clientSecret: process.env.KEYCLOAK_CLIENT_SECRET as string,
    callback: "/",
    scope: ["openid"]
};

const protocol = process.env.NODE_ENV === "production" ? "https://" : "http://";

type WellKnownConfiguration = {
    authorization_endpoint: string
    token_endpoint: string
    end_session_endpoint: string
}

async function getKeycloakConfiguration(): Promise<WellKnownConfiguration> {
    const url = `${protocol}${opts.keycloakSubdomain}/.well-known/openid-configuration`;
    const res = await fetch(url);
    return res.json() as unknown as WellKnownConfiguration;
}

async function test() {
    const config = await getKeycloakConfiguration();
    const tokenEndpoint = config.token_endpoint;
    const keycloak = {
        key: opts.clientId,
        secret: opts.clientSecret,
        oauth: 2,
        authorize_url: config.authorization_endpoint,
        access_url: config.token_endpoint,
        callback: opts.callback ?? '/',
        scope: opts.scope ?? ['openid'],
        nonce: true
    }
}

test().then(console.log)