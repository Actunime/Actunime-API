import fastifySwagger from '@fastify/swagger';
import { FastifyInstance } from 'fastify';
import { version } from "../../package.json";
import { jsonSchemaTransform } from 'fastify-type-provider-zod';
import SwaggerUiPlugin from './_swagger-ui';

const SwaggerPlugin = async (fastify: FastifyInstance) => {
    await fastify.register(fastifySwagger, {
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
            tags: [
                { name: 'Auth', description: 'Auth end-points' },
                { name: 'Account', description: 'Account end-points' },
                { name: 'User', description: 'User end-points' },
                { name: "Anime", description: 'Anime end-points' }
            ],
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
    })

    await fastify.register(SwaggerUiPlugin);
}

export { SwaggerPlugin };