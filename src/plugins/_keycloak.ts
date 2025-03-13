import fastify, { FastifyInstance, FastifyRequest } from "fastify";

const opts = {
    appOrigin: process.env.APP_ORIGIN as string,
    keycloakSubdomain: process.env.KEYCLOAK_SERVER_URL as string,
    clientId: process.env.KEYCLOAK_CLIENT_ID as string,
    clientSecret: process.env.KEYCLOAK_CLIENT_SECRET as string
};

const protocol = process.env.NODE_ENV === "production" ? "https://" : "http://";

async function getKeycloakConfiguration() {
    const url = `${protocol}${opts.keycloakSubdomain}/.well-known/openid-configuration`;
    const res = await fetch(url);
    return res.json();
}

const KeycloakPlugin = async (fastify: FastifyInstance) => {
}

export { KeycloakPlugin }