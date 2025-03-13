import { SwaggerOptions } from '@fastify/swagger';
import { version } from "../../package.json";
import { jsonSchemaTransform } from 'fastify-type-provider-zod';
import { TargetPathArray } from '@actunime/types';
import { FastifySwaggerUiOptions } from '@fastify/swagger-ui';
import fs from 'fs';
import path from 'path';

export const swaggerOptions: SwaggerOptions = {
    openapi: {
        info: {
            title: 'Actunime API',
            description: 'Actunime API (fastify swagger api doc)',
            version
        },
        servers: [
            {
                url: 'http://localhost:' + parseInt(process.env.PORT as string),
                description: 'Development server'
            }
        ],
        tags: TargetPathArray.map((t) => ({ name: t, description: t + " end-points" })),
        components: {
            securitySchemes: {
                authorization: {
                    type: "http",
                    scheme: "bearer",
                }
            }
        },
        externalDocs: {
            url: 'https://discord.gg/TJuKYa694n',
            description: 'Actunime Discord'
        }
    },
    transform: jsonSchemaTransform
}

export const SwaggerUiOptions: FastifySwaggerUiOptions = {
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
}
