import { FastifyPluginAsync, RouteShorthandOptions } from 'fastify';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { pipeline } from 'stream/promises';
import { countMp3Frames } from '../services/parser.service';

const uploadOpts: RouteShorthandOptions = {
  schema: {
    summary: 'Upload MP3 file for analysis',
    consumes: ['multipart/form-data'],
    body: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' }
      }
    },
    response: {
      200: {
        type: 'object',
        properties: {
          frameCount: { type: 'number' }
        }
      },
      '4xx': {
        type: 'object',
        properties: {
          statusCode: { type: 'number' },
          error: { type: 'string' },
          message: { type: 'string' }
        }
      }
    }
  },
  validatorCompiler: () => {
    return () => true;
  }
};

const uploadRoutes: FastifyPluginAsync = async (fastify, _opts): Promise<void> => {
  fastify.post('/file-upload', uploadOpts, async (request) => {
    // Get the uploaded file
    const data = await request.file();

    if (!data) {
      throw fastify.httpErrors.badRequest('No file uploaded');
    }

    const isMp3 = data.mimetype === 'audio/mpeg' || data.filename.toLowerCase().endsWith('.mp3');

    if (!isMp3) {
      // Consume the stream so the connection doesn't hang, then throw
      data.file.resume();
      throw fastify.httpErrors.badRequest('Invalid file type');
    }

    // Create a temporary file path
    const tempFilePath = path.join(os.tmpdir(), `mp3-${Date.now()}-${data.filename}`);

    try {
      // Stream to disk
      await pipeline(data.file, fs.createWriteStream(tempFilePath));

      // Get frame count
      const frameCount = await countMp3Frames(tempFilePath);

      return { frameCount };
    } catch (err) {
      request.log.error(err);
      throw fastify.httpErrors.internalServerError('Failed to process file');
    } finally {
      try {
        // Cleanup
        await fs.promises.unlink(tempFilePath);
      } catch (ignore) { }
    }
  });
}

export default uploadRoutes;