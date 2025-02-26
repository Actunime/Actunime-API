import fastifySwaggerUi from '@fastify/swagger-ui';
import { FastifyInstance } from 'fastify';
import fs from 'fs';
import path from 'path';

const SwaggerUiPlugin = async (fastify: FastifyInstance) => {
    await fastify.register(fastifySwaggerUi, {
        logo: {
            type: "image/png",
            content: fs.readFileSync(path.join(__dirname, "..", "..", "public", "logo.png")),
            href: "/doc",
            target: '_blank'
        },
        routePrefix: '/doc',
        uiConfig: {
            docExpansion: 'list',
            deepLinking: false
        },
        staticCSP: true
    })
}

// Utilisé dans plugins/_swagger.ts
export default SwaggerUiPlugin;