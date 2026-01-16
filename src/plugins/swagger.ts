import swagger, { FastifySwaggerOptions } from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import fp from 'fastify-plugin';

export default fp<FastifySwaggerOptions>(async (fastify) => {
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'MP3 Parser API',
        description: 'High-performance stream-based MP3 frame counter',
        version: '1.0.0',
      },
      servers: [{ url: 'http://localhost:3000' }],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false,
    },
    staticCSP: true,
  });
});
