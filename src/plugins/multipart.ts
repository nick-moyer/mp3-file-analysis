import fp from 'fastify-plugin';
import multipart, { FastifyMultipartOptions } from '@fastify/multipart';

/**
 * This plugins adds multipart support for handling file uploads
 *
 * @see https://github.com/fastify/fastify-multipart
 */
export default fp<FastifyMultipartOptions>(async (fastify) => {
    fastify.register(multipart, {
        limits: {
            fileSize: 50 * 1024 * 1024, // 50MB limit (Scalability)
        },
    });
});